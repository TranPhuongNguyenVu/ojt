package org.example.be.mapper;

import org.example.be.dto.EmployeeDTO;
import org.example.be.entity.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    @Mapping(source = "employeeId", target = "employeeId")
    @Mapping(source = "account.username", target = "username")
    @Mapping(source = "account.fullName", target = "employeeName")
    @Mapping(source = "account.image", target = "image")
    @Mapping(source = "account.identityCard", target = "identityCard")
    @Mapping(source = "account.email", target = "email")
    @Mapping(source = "account.phoneNumber", target = "phoneNumber")
    @Mapping(source = "account.address", target = "address")
    @Mapping(source = "account.dateOfBirth", target = "dateOfBirth")
    @Mapping(source = "account.gender", target = "gender")
    @Mapping(source = "account.status", target = "status")
    EmployeeDTO toDTO(Employee employee);
}
