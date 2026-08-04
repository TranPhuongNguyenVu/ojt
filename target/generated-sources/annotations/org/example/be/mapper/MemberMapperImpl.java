package org.example.be.mapper;

import java.time.LocalDate;
import javax.annotation.processing.Generated;
import org.example.be.dto.MemberDTO;
import org.example.be.entity.Account;
import org.example.be.entity.Member;
import org.example.be.entity.Role;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-04T07:44:45+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class MemberMapperImpl implements MemberMapper {

    @Override
    public MemberDTO toDTO(Member member) {
        if ( member == null ) {
            return null;
        }

        MemberDTO.MemberDTOBuilder memberDTO = MemberDTO.builder();

        memberDTO.accountId( memberAccountAccountId( member ) );
        memberDTO.fullName( memberAccountFullName( member ) );
        memberDTO.email( memberAccountEmail( member ) );
        memberDTO.phoneNumber( memberAccountPhoneNumber( member ) );
        memberDTO.gender( memberAccountGender( member ) );
        memberDTO.identityCard( memberAccountIdentityCard( member ) );
        memberDTO.username( memberAccountUsername( member ) );
        memberDTO.address( memberAccountAddress( member ) );
        memberDTO.dateOfBirth( memberAccountDateOfBirth( member ) );
        memberDTO.image( memberAccountImage( member ) );
        memberDTO.status( memberAccountStatus( member ) );
        memberDTO.roleId( memberAccountRoleRoleId( member ) );
        memberDTO.memberId( member.getMemberId() );
        memberDTO.score( member.getScore() );

        return memberDTO.build();
    }

    private String memberAccountAccountId(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String accountId = account.getAccountId();
        if ( accountId == null ) {
            return null;
        }
        return accountId;
    }

    private String memberAccountFullName(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String fullName = account.getFullName();
        if ( fullName == null ) {
            return null;
        }
        return fullName;
    }

    private String memberAccountEmail(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String email = account.getEmail();
        if ( email == null ) {
            return null;
        }
        return email;
    }

    private String memberAccountPhoneNumber(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String phoneNumber = account.getPhoneNumber();
        if ( phoneNumber == null ) {
            return null;
        }
        return phoneNumber;
    }

    private String memberAccountGender(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String gender = account.getGender();
        if ( gender == null ) {
            return null;
        }
        return gender;
    }

    private String memberAccountIdentityCard(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String identityCard = account.getIdentityCard();
        if ( identityCard == null ) {
            return null;
        }
        return identityCard;
    }

    private String memberAccountUsername(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String username = account.getUsername();
        if ( username == null ) {
            return null;
        }
        return username;
    }

    private String memberAccountAddress(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String address = account.getAddress();
        if ( address == null ) {
            return null;
        }
        return address;
    }

    private LocalDate memberAccountDateOfBirth(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        LocalDate dateOfBirth = account.getDateOfBirth();
        if ( dateOfBirth == null ) {
            return null;
        }
        return dateOfBirth;
    }

    private String memberAccountImage(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        String image = account.getImage();
        if ( image == null ) {
            return null;
        }
        return image;
    }

    private Integer memberAccountStatus(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        Integer status = account.getStatus();
        if ( status == null ) {
            return null;
        }
        return status;
    }

    private Integer memberAccountRoleRoleId(Member member) {
        if ( member == null ) {
            return null;
        }
        Account account = member.getAccount();
        if ( account == null ) {
            return null;
        }
        Role role = account.getRole();
        if ( role == null ) {
            return null;
        }
        Integer roleId = role.getRoleId();
        if ( roleId == null ) {
            return null;
        }
        return roleId;
    }
}
