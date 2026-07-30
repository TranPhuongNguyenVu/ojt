package org.example.be.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.be.dto.ComboDTO;
import org.example.be.dto.ComboRequestDTO;
import org.example.be.entity.Combo;
import org.example.be.entity.ConcessionPrice;
import org.example.be.enums.ConcessionStatus;
import org.example.be.mapper.ComboMapper;
import org.example.be.repository.ComboRepository;
import org.example.be.repository.ConcessionPriceRepository;
import org.example.be.util.TextNormalizeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ComboService {
    private static final Set<ConcessionStatus> CUSTOMER_HIDDEN_STATUSES =
            EnumSet.of(ConcessionStatus.INACTIVE, ConcessionStatus.DELETED);

    @Autowired
    private ComboRepository comboRepository;
    @Autowired
    private ConcessionPriceRepository concessionPriceRepository;
    @Autowired
    private ComboMapper comboMapper;

    @Transactional(readOnly = true)
    public List<ComboDTO> getAll(boolean isAdmin) {
        List<Combo> combos = isAdmin ? comboRepository.findAll() : comboRepository.findByStatusNot(ConcessionStatus.DELETED);
        return filterForAudience(mapList(combos), isAdmin);
    }

    @Transactional(readOnly = true)
    public List<ComboDTO> search(String keyword, boolean isAdmin) {
        List<Combo> base = isAdmin ? comboRepository.findAll() : comboRepository.findByStatusNot(ConcessionStatus.DELETED);
        String needle = TextNormalizeUtil.stripDiacritics(keyword).toLowerCase();
        List<Combo> matched = base.stream()
                .filter(c -> TextNormalizeUtil.stripDiacritics(c.getComboName()).toLowerCase().contains(needle))
                .collect(Collectors.toList());
        return filterForAudience(mapList(matched), isAdmin);
    }

    @Transactional(readOnly = true)
    public ComboDTO getById(Integer id) {
        return comboMapper.toDTO(findOrThrow(id));
    }

    @Transactional
    public ComboDTO create(ComboRequestDTO requestDTO) {
        String name = ConcessionSupport.requireName(requestDTO.getComboName());
        requireUniqueName(name, null);
        ConcessionSupport.validatePrices(requestDTO.getPrices());
        ConcessionStatus status = ConcessionSupport.resolveRequestStatus(requestDTO.getStatus());

        Combo combo = comboMapper.toEntity(requestDTO);
        combo.setComboName(name);
        combo.setStatus(status);
        Combo saved = comboRepository.save(combo);

        List<ConcessionPrice> prices = requestDTO.getPrices().stream()
                .map(p -> ConcessionPrice.builder().combo(saved).size(p.getSize()).price(p.getPrice()).build())
                .collect(Collectors.toList());
        saved.setPrices(concessionPriceRepository.saveAll(prices));

        return comboMapper.toDTO(saved);
    }

    @Transactional
    public ComboDTO update(Integer id, ComboRequestDTO requestDTO) {
        Combo combo = findOrThrow(id);
        String name = ConcessionSupport.requireName(requestDTO.getComboName());
        requireUniqueName(name, id);
        ConcessionSupport.validatePrices(requestDTO.getPrices());
        ConcessionStatus status = ConcessionSupport.resolveRequestStatus(requestDTO.getStatus());

        combo.setComboName(name);
        combo.setDescription(requestDTO.getDescription());
        combo.setImage(requestDTO.getImage());
        combo.setStatus(status);
        Combo saved = comboRepository.save(combo);

        concessionPriceRepository.deleteByCombo_ComboId(id);
        List<ConcessionPrice> prices = requestDTO.getPrices().stream()
                .map(p -> ConcessionPrice.builder().combo(saved).size(p.getSize()).price(p.getPrice()).build())
                .collect(Collectors.toList());
        saved.setPrices(concessionPriceRepository.saveAll(prices));

        return comboMapper.toDTO(saved);
    }

    @Transactional
    public ComboDTO delete(Integer id) {
        Combo combo = findOrThrow(id);
        if (combo.getStatus() == ConcessionStatus.DELETED) {
            throw new EntityNotFoundException("Combo not found");
        }
        combo.setStatus(ConcessionStatus.DELETED);
        return comboMapper.toDTO(comboRepository.save(combo));
    }

    @Transactional
    public ComboDTO activate(Integer id) {
        Combo combo = findOrThrow(id);
        combo.setStatus(ConcessionStatus.ACTIVE);
        return comboMapper.toDTO(comboRepository.save(combo));
    }

    private Combo findOrThrow(Integer id) {
        return comboRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Combo not found"));
    }

    private void requireUniqueName(String name, Integer excludeId) {
        boolean duplicate = comboRepository.findAll().stream()
                .filter(c -> c.getStatus() != ConcessionStatus.DELETED)
                .filter(c -> excludeId == null || !c.getComboId().equals(excludeId))
                .anyMatch(c -> c.getComboName().equalsIgnoreCase(name));
        if (duplicate) {
            throw new IllegalArgumentException("Combo name already exists");
        }
    }

    private List<ComboDTO> filterForAudience(List<ComboDTO> combos, boolean isAdmin) {
        if (isAdmin) {
            return combos;
        }
        return combos.stream()
                .filter(dto -> !CUSTOMER_HIDDEN_STATUSES.contains(ConcessionStatus.valueOf(dto.getStatus())))
                .collect(Collectors.toList());
    }

    private List<ComboDTO> mapList(List<Combo> combos) {
        return combos.stream().map(comboMapper::toDTO).collect(Collectors.toList());
    }
}
