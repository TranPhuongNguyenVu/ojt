package org.example.be.mapper;

import org.example.be.dto.AccountDTO;
import org.example.be.entity.Account;
import org.example.be.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccountMapper {

    // Chiều 1: Entity -> DTO (Bỏ qua việc lấy password, lấy roleName từ đối tượng Role)
    // Bỏ qua Pasword
    @Mapping(target = "password", ignore = true)
    // Lấy roleName trong bảng role
    @Mapping(source = "role.roleName", target = "roleName")
    AccountDTO toDTO(Account account);
}
