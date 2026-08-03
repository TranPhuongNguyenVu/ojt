package org.example.be.mapper;

import org.example.be.dto.MemberDTO;
import org.example.be.entity.Member;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MemberMapper {

    // Yêu cầu MapStruct lôi các trường nằm trong lớp con "account" đập thẳng vào DTO
    @Mapping(source = "account.accountId", target = "accountId")
    @Mapping(source = "account.fullName", target = "fullName")
    @Mapping(source = "account.email", target = "email")
    @Mapping(source = "account.phoneNumber", target = "phoneNumber")
    @Mapping(source = "account.gender", target = "gender")
    @Mapping(source = "account.identityCard", target = "identityCard")
    @Mapping(source = "account.username", target = "username")
    @Mapping(source = "account.address", target = "address")
    @Mapping(source = "account.dateOfBirth", target = "dateOfBirth")
    @Mapping(source = "account.image", target = "image")
    @Mapping(source = "account.status", target = "status")
    @Mapping(source = "account.role.roleId", target = "roleId")
    MemberDTO toDTO(Member member);
}