package org.example.be.service;

import org.example.be.entity.Account;
import org.example.be.entity.Role;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.example.be.dto.AccountDTO;
import org.example.be.mapper.AccountMapper;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AccountMapper accountMapper;

    public List<AccountDTO> getAllAccounts() {
        // 1. Lấy toàn bộ danh sách Account (Entity) từ Database
        List<Account> accounts = accountRepository.findAll();
        
        // 2. Tạo một danh sách rỗng để chứa các AccountDTO
        List<AccountDTO> accountDTOs = new ArrayList<>();
        
        // 3. Dùng vòng lặp duyệt qua từng Account lấy được
        for (Account account : accounts) {
            // Dùng Mapper để biến đổi Entity thành DTO
            AccountDTO dto = accountMapper.toDTO(account);
            
            // Thêm DTO vừa biến đổi vào danh sách mới
            accountDTOs.add(dto);
        }
        
        // 4. Trả về danh sách DTO cho Controller
        return accountDTOs;
    }


    public List<AccountDTO> getAllCustomers() {
        // 1. Nhờ Repository tìm TẤT CẢ những người có quyền là "Customer"
        List<Account> customers = accountRepository.findByRole_RoleName("Customer");

        // 2. Tạo một danh sách rỗng để chứa DTO
        List<AccountDTO> resultList = new ArrayList<>();

        // 3. Vòng lặp duyệt từng người để biến đổi Entity thành DTO
        for (Account acc : customers) {
            AccountDTO dto = accountMapper.toDTO(acc);
            resultList.add(dto);
        }

        // 4. Trả kết quả về
        return resultList;
    }
}
