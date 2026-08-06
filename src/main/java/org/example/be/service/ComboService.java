package org.example.be.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.be.dto.ComboDTO;
import org.example.be.dto.ComboItemRequestDTO;
import org.example.be.dto.ComboRequestDTO;
import org.example.be.entity.Combo;
import org.example.be.entity.ComboItem;
import org.example.be.entity.ConcessionPrice;
import org.example.be.entity.Drink;
import org.example.be.entity.Food;
import org.example.be.enums.ConcessionSize;
import org.example.be.enums.ConcessionStatus;
import org.example.be.mapper.ComboMapper;
import org.example.be.repository.ComboItemRepository;
import org.example.be.repository.ComboRepository;
import org.example.be.repository.ConcessionPriceRepository;
import org.example.be.repository.DrinkRepository;
import org.example.be.repository.FoodRepository;
import org.example.be.util.TextNormalizeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
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
    private ComboItemRepository comboItemRepository;
    @Autowired
    private FoodRepository foodRepository;
    @Autowired
    private DrinkRepository drinkRepository;
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

    @Transactional(readOnly = true)
    public ComboDTO getPublicById(Integer id) {
        org.example.be.entity.Combo combo = findOrThrow(id);
        if (CUSTOMER_HIDDEN_STATUSES.contains(combo.getStatus())) {
            throw new jakarta.persistence.EntityNotFoundException("Không tìm thấy combo.");
        }
        return comboMapper.toDTO(combo);
    }

    @Transactional
    public ComboDTO create(ComboRequestDTO requestDTO) {
        String name = ConcessionSupport.requireName(requestDTO.getComboName());
        requireUniqueName(name, null);
        ConcessionSupport.validatePrices(requestDTO.getPrices());
        ConcessionStatus status = ConcessionSupport.resolveRequestStatus(requestDTO.getStatus());

        List<ComboItem> items = buildItems(requestDTO.getItems());

        Combo combo = comboMapper.toEntity(requestDTO);
        combo.setComboName(name);
        combo.setStatus(status);
        Combo saved = comboRepository.save(combo);

        List<ConcessionPrice> prices = requestDTO.getPrices().stream()
                .map(p -> ConcessionPrice.builder().combo(saved).size(p.getSize()).price(p.getPrice()).build())
                .collect(Collectors.toList());
        saved.setPrices(concessionPriceRepository.saveAll(prices));

        items.forEach(item -> item.setCombo(saved));
        saved.setItems(comboItemRepository.saveAll(items));

        return comboMapper.toDTO(saved);
    }

    @Transactional
    public ComboDTO update(Integer id, ComboRequestDTO requestDTO) {
        Combo combo = findOrThrow(id);
        String name = ConcessionSupport.requireName(requestDTO.getComboName());
        requireUniqueName(name, id);
        ConcessionSupport.validatePrices(requestDTO.getPrices());
        ConcessionStatus status = ConcessionSupport.resolveRequestStatus(requestDTO.getStatus());
        List<ComboItem> items = buildItems(requestDTO.getItems());

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

        comboItemRepository.deleteByCombo_ComboId(id);
        items.forEach(item -> item.setCombo(saved));
        saved.setItems(comboItemRepository.saveAll(items));

        return comboMapper.toDTO(saved);
    }

    @Transactional
    public ComboDTO delete(Integer id) {
        Combo combo = findOrThrow(id);
        if (combo.getStatus() == ConcessionStatus.DELETED) {
            throw new EntityNotFoundException("Không tìm thấy combo.");
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
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy combo."));
    }

    private void requireUniqueName(String name, Integer excludeId) {
        boolean duplicate = comboRepository.findAll().stream()
                .filter(c -> c.getStatus() != ConcessionStatus.DELETED)
                .filter(c -> excludeId == null || !c.getComboId().equals(excludeId))
                .anyMatch(c -> c.getComboName().equalsIgnoreCase(name));
        if (duplicate) {
            throw new IllegalArgumentException("Tên combo đã tồn tại.");
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

    /**
     * A combo must contain >=1 FOOD and >=1 DRINK; each item references exactly one, at one
     * size that item is actually priced at, no duplicates, no DELETED items.
     */
    private List<ComboItem> buildItems(List<ComboItemRequestDTO> itemRequests) {
        List<ComboItemRequestDTO> requests = itemRequests != null ? itemRequests : List.of();
        Set<String> seenFoodKeys = new HashSet<>();
        Set<String> seenDrinkKeys = new HashSet<>();
        List<ComboItem> items = new ArrayList<>();
        boolean hasFood = false;
        boolean hasDrink = false;

        for (ComboItemRequestDTO req : requests) {
            boolean hasFoodId = req.getFoodId() != null;
            boolean hasDrinkId = req.getDrinkId() != null;
            if (hasFoodId == hasDrinkId) {
                throw new IllegalArgumentException("Each combo item must reference exactly one food or drink");
            }
            if (req.getQuantity() == null || req.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng thành phần combo phải lớn hơn 0.");
            }
            if (req.getSize() == null) {
                throw new IllegalArgumentException("Vui lòng chọn kích cỡ cho thành phần combo.");
            }

            if (hasFoodId) {
                if (!seenFoodKeys.add(req.getFoodId() + ":" + req.getSize())) {
                    throw new IllegalArgumentException("Duplicate food item in combo: " + req.getFoodId());
                }
                Food food = foodRepository.findById(req.getFoodId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Không tìm thấy món ăn ID: " + req.getFoodId()));
                if (food.getStatus() == ConcessionStatus.DELETED) {
                    throw new IllegalArgumentException("Food item is deleted: " + food.getFoodName());
                }
                requireSizeExists(food.getPrices(), req.getSize(), food.getFoodName());
                items.add(ComboItem.builder().food(food).size(req.getSize()).quantity(req.getQuantity()).build());
                hasFood = true;
            } else {
                if (!seenDrinkKeys.add(req.getDrinkId() + ":" + req.getSize())) {
                    throw new IllegalArgumentException("Duplicate drink item in combo: " + req.getDrinkId());
                }
                Drink drink = drinkRepository.findById(req.getDrinkId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Không tìm thấy thức uống ID: " + req.getDrinkId()));
                if (drink.getStatus() == ConcessionStatus.DELETED) {
                    throw new IllegalArgumentException("Drink item is deleted: " + drink.getDrinkName());
                }
                requireSizeExists(drink.getPrices(), req.getSize(), drink.getDrinkName());
                items.add(ComboItem.builder().drink(drink).size(req.getSize()).quantity(req.getQuantity()).build());
                hasDrink = true;
            }
        }

        if (!hasFood || !hasDrink) {
            throw new IllegalArgumentException("A combo must contain at least one food and one drink item");
        }

        return items;
    }

    private void requireSizeExists(List<ConcessionPrice> prices, ConcessionSize size, String itemName) {
        boolean exists = prices != null && prices.stream().anyMatch(p -> p.getSize() == size);
        if (!exists) {
            throw new IllegalArgumentException(itemName + " has no price for size " + size);
        }
    }
}
