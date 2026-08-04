package org.example.be.mapper;

import javax.annotation.processing.Generated;
import org.example.be.dto.AccountDTO;
import org.example.be.entity.Account;
import org.example.be.entity.Role;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-04T07:44:45+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class AccountMapperImpl implements AccountMapper {

    @Override
    public AccountDTO toDTO(Account account) {
        if ( account == null ) {
            return null;
        }

        AccountDTO.AccountDTOBuilder accountDTO = AccountDTO.builder();

        accountDTO.roleName( accountRoleRoleName( account ) );
        accountDTO.accountId( account.getAccountId() );
        accountDTO.username( account.getUsername() );
        accountDTO.fullName( account.getFullName() );
        accountDTO.email( account.getEmail() );
        accountDTO.phoneNumber( account.getPhoneNumber() );
        accountDTO.address( account.getAddress() );
        accountDTO.gender( account.getGender() );
        accountDTO.image( account.getImage() );
        accountDTO.status( account.getStatus() );
        accountDTO.registerDate( account.getRegisterDate() );
        accountDTO.createdBy( account.getCreatedBy() );

        return accountDTO.build();
    }

    private String accountRoleRoleName(Account account) {
        if ( account == null ) {
            return null;
        }
        Role role = account.getRole();
        if ( role == null ) {
            return null;
        }
        String roleName = role.getRoleName();
        if ( roleName == null ) {
            return null;
        }
        return roleName;
    }
}
