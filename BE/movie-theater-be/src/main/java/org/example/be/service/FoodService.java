package org.example.be.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.be.dto.FoodDTO;
import org.example.be.dto.FoodRequestDTO;
import org.example.be.entity.ConcessionPrice;
import org.example.be.entity.Food;
import org.example.be.enums.ConcessionStatus;
import org.example.be.mapper.FoodMapper;
import org.example.be.repository.ComboItemRepository;
import org.example.be.repository.ConcessionPriceRepository;
import org.example.be.repository.FoodRepository;
import org.example.be.util.TextNormalizeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FoodService {
    private static final Set<ConcessionStatus> CUSTOMER_HIDDEN_STATUSES =
            EnumSet.of(ConcessionStatus.INACTIVE, ConcessionStatus.DELETED);

    @Autowired
    private FoodRepository foodRepository;
    @Autowired
    private ConcessionPriceRepository concessionPriceRepository;
    @Autowired
    private ComboItemRepository comboItemRepository;
    @Autowired
    private FoodMapper foodMapper;

    @Transactional(readOnly = true)
    public List<FoodDTO> getAll(boolean isAdmin) {
        List<Food> foods = isAdmin ? foodRepository.findAll() : foodRepository.findByStatusNot(ConcessionStatus.DELETED);
        return filterForAudience(mapList(foods), isAdmin);
    }

    @Transactional(readOnly = true)
    public List<FoodDTO> search(String keyword, boolean isAdmin) {
        List<Food> base = isAdmin ? foodRepository.findAll() : foodRepository.findByStatusNot(ConcessionStatus.DELETED);
        String needle = TextNormalizeUtil.stripDiacritics(keyword).toLowerCase();
        List<Food> matched = base.stream()
                .filter(f -> TextNormalizeUtil.stripDiacritics(f.getFoodName()).toLowerCase().contains(needle))
                .collect(Collectors.toList());
        return filterForAudience(mapList(matched), isAdmin);
    }

    @Transactional(readOnly = true)
    public FoodDTO getById(Integer id) {
        return foodMapper.toDTO(findOrThrow(id));
    }

    @Transactional
    public FoodDTO create(FoodRequestDTO requestDTO) {
        String name = ConcessionSupport.requireName(requestDTO.getFoodName());
        requireUniqueName(name, null);
        ConcessionSupport.validatePrices(requestDTO.getPrices());
        ConcessionStatus status = ConcessionSupport.resolveRequestStatus(requestDTO.getStatus());

        Food food = foodMapper.toEntity(requestDTO);
        food.setFoodName(name);
        food.setStatus(status);
        Food saved = foodRepository.save(food);

        List<ConcessionPrice> prices = requestDTO.getPrices().stream()
                .map(p -> ConcessionPrice.builder().food(saved).size(p.getSize()).price(p.getPrice()).build())
                .collect(Collectors.toList());
        saved.setPrices(concessionPriceRepository.saveAll(prices));

        return foodMapper.toDTO(saved);
    }

    @Transactional
    public FoodDTO update(Integer id, FoodRequestDTO requestDTO) {
        Food food = findOrThrow(id);
        String name = ConcessionSupport.requireName(requestDTO.getFoodName());
        requireUniqueName(name, id);
        ConcessionSupport.validatePrices(requestDTO.getPrices());
        ConcessionStatus status = ConcessionSupport.resolveRequestStatus(requestDTO.getStatus());

        food.setFoodName(name);
        food.setDescription(requestDTO.getDescription());
        food.setImage(requestDTO.getImage());
        food.setStatus(status);
        Food saved = foodRepository.save(food);

        concessionPriceRepository.deleteByFood_FoodId(id);
        List<ConcessionPrice> prices = requestDTO.getPrices().stream()
                .map(p -> ConcessionPrice.builder().food(saved).size(p.getSize()).price(p.getPrice()).build())
                .collect(Collectors.toList());
        saved.setPrices(concessionPriceRepository.saveAll(prices));

        return foodMapper.toDTO(saved);
    }

    @Transactional
    public FoodDTO delete(Integer id) {
        Food food = findOrThrow(id);
        if (food.getStatus() == ConcessionStatus.DELETED) {
            throw new EntityNotFoundException("Food not found");
        }
        if (comboItemRepository.existsByFood_FoodIdAndCombo_StatusNot(id, ConcessionStatus.DELETED)) {
            throw new IllegalStateException(
                    "Không thể xóa món ăn đang thuộc một combo. Vui lòng xóa combo đó trước.");
        }
        food.setStatus(ConcessionStatus.DELETED);
        return foodMapper.toDTO(foodRepository.save(food));
    }

    @Transactional
    public FoodDTO activate(Integer id) {
        Food food = findOrThrow(id);
        food.setStatus(ConcessionStatus.ACTIVE);
        return foodMapper.toDTO(foodRepository.save(food));
    }

    private Food findOrThrow(Integer id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Food not found"));
    }

    private void requireUniqueName(String name, Integer excludeId) {
        boolean duplicate = foodRepository.findAll().stream()
                .filter(f -> f.getStatus() != ConcessionStatus.DELETED)
                .filter(f -> excludeId == null || !f.getFoodId().equals(excludeId))
                .anyMatch(f -> f.getFoodName().equalsIgnoreCase(name));
        if (duplicate) {
            throw new IllegalArgumentException("Food name already exists");
        }
    }

    private List<FoodDTO> filterForAudience(List<FoodDTO> foods, boolean isAdmin) {
        if (isAdmin) {
            return foods;
        }
        return foods.stream()
                .filter(dto -> !CUSTOMER_HIDDEN_STATUSES.contains(ConcessionStatus.valueOf(dto.getStatus())))
                .collect(Collectors.toList());
    }

    private List<FoodDTO> mapList(List<Food> foods) {
        return foods.stream().map(foodMapper::toDTO).collect(Collectors.toList());
    }
}
