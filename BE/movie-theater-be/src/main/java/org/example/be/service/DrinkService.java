package org.example.be.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.be.dto.DrinkDTO;
import org.example.be.dto.DrinkRequestDTO;
import org.example.be.entity.ConcessionPrice;
import org.example.be.entity.Drink;
import org.example.be.enums.ConcessionStatus;
import org.example.be.mapper.DrinkMapper;
import org.example.be.repository.ConcessionPriceRepository;
import org.example.be.repository.DrinkRepository;
import org.example.be.util.TextNormalizeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DrinkService {
    private static final Set<ConcessionStatus> CUSTOMER_HIDDEN_STATUSES =
            EnumSet.of(ConcessionStatus.INACTIVE, ConcessionStatus.DELETED);

    @Autowired
    private DrinkRepository drinkRepository;
    @Autowired
    private ConcessionPriceRepository concessionPriceRepository;
    @Autowired
    private DrinkMapper drinkMapper;

    @Transactional(readOnly = true)
    public List<DrinkDTO> getAll(boolean isAdmin) {
        List<Drink> drinks = isAdmin ? drinkRepository.findAll() : drinkRepository.findByStatusNot(ConcessionStatus.DELETED);
        return filterForAudience(mapList(drinks), isAdmin);
    }

    @Transactional(readOnly = true)
    public List<DrinkDTO> search(String keyword, boolean isAdmin) {
        List<Drink> base = isAdmin ? drinkRepository.findAll() : drinkRepository.findByStatusNot(ConcessionStatus.DELETED);
        String needle = TextNormalizeUtil.stripDiacritics(keyword).toLowerCase();
        List<Drink> matched = base.stream()
                .filter(d -> TextNormalizeUtil.stripDiacritics(d.getDrinkName()).toLowerCase().contains(needle))
                .collect(Collectors.toList());
        return filterForAudience(mapList(matched), isAdmin);
    }

    @Transactional(readOnly = true)
    public DrinkDTO getById(Integer id) {
        return drinkMapper.toDTO(findOrThrow(id));
    }

    @Transactional
    public DrinkDTO create(DrinkRequestDTO requestDTO) {
        String name = ConcessionSupport.requireName(requestDTO.getDrinkName());
        requireUniqueName(name, null);
        ConcessionSupport.validatePrices(requestDTO.getPrices());
        ConcessionStatus status = ConcessionSupport.resolveRequestStatus(requestDTO.getStatus());

        Drink drink = drinkMapper.toEntity(requestDTO);
        drink.setDrinkName(name);
        drink.setStatus(status);
        Drink saved = drinkRepository.save(drink);

        List<ConcessionPrice> prices = requestDTO.getPrices().stream()
                .map(p -> ConcessionPrice.builder().drink(saved).size(p.getSize()).price(p.getPrice()).build())
                .collect(Collectors.toList());
        saved.setPrices(concessionPriceRepository.saveAll(prices));

        return drinkMapper.toDTO(saved);
    }

    @Transactional
    public DrinkDTO update(Integer id, DrinkRequestDTO requestDTO) {
        Drink drink = findOrThrow(id);
        String name = ConcessionSupport.requireName(requestDTO.getDrinkName());
        requireUniqueName(name, id);
        ConcessionSupport.validatePrices(requestDTO.getPrices());
        ConcessionStatus status = ConcessionSupport.resolveRequestStatus(requestDTO.getStatus());

        drink.setDrinkName(name);
        drink.setDescription(requestDTO.getDescription());
        drink.setImage(requestDTO.getImage());
        drink.setStatus(status);
        Drink saved = drinkRepository.save(drink);

        concessionPriceRepository.deleteByDrink_DrinkId(id);
        List<ConcessionPrice> prices = requestDTO.getPrices().stream()
                .map(p -> ConcessionPrice.builder().drink(saved).size(p.getSize()).price(p.getPrice()).build())
                .collect(Collectors.toList());
        saved.setPrices(concessionPriceRepository.saveAll(prices));

        return drinkMapper.toDTO(saved);
    }

    @Transactional
    public DrinkDTO delete(Integer id) {
        Drink drink = findOrThrow(id);
        if (drink.getStatus() == ConcessionStatus.DELETED) {
            throw new EntityNotFoundException("Drink not found");
        }
        drink.setStatus(ConcessionStatus.DELETED);
        return drinkMapper.toDTO(drinkRepository.save(drink));
    }

    @Transactional
    public DrinkDTO activate(Integer id) {
        Drink drink = findOrThrow(id);
        drink.setStatus(ConcessionStatus.ACTIVE);
        return drinkMapper.toDTO(drinkRepository.save(drink));
    }

    private Drink findOrThrow(Integer id) {
        return drinkRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Drink not found"));
    }

    private void requireUniqueName(String name, Integer excludeId) {
        boolean duplicate = drinkRepository.findAll().stream()
                .filter(d -> d.getStatus() != ConcessionStatus.DELETED)
                .filter(d -> excludeId == null || !d.getDrinkId().equals(excludeId))
                .anyMatch(d -> d.getDrinkName().equalsIgnoreCase(name));
        if (duplicate) {
            throw new IllegalArgumentException("Drink name already exists");
        }
    }

    private List<DrinkDTO> filterForAudience(List<DrinkDTO> drinks, boolean isAdmin) {
        if (isAdmin) {
            return drinks;
        }
        return drinks.stream()
                .filter(dto -> !CUSTOMER_HIDDEN_STATUSES.contains(ConcessionStatus.valueOf(dto.getStatus())))
                .collect(Collectors.toList());
    }

    private List<DrinkDTO> mapList(List<Drink> drinks) {
        return drinks.stream().map(drinkMapper::toDTO).collect(Collectors.toList());
    }
}
