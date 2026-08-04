package org.example.be.mapper;

import java.time.LocalDate;
import javax.annotation.processing.Generated;
import org.example.be.dto.EmployeeDTO;
import org.example.be.entity.Account;
import org.example.be.entity.Employee;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-04T07:44:45+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class EmployeeMapperImpl implements EmployeeMapper {

    @Override
    public EmployeeDTO toDTO(Employee employee) {
        if ( employee == null ) {
            return null;
        }

        EmployeeDTO.EmployeeDTOBuilder employeeDTO = EmployeeDTO.builder();

        employeeDTO.employeeId( employee.getEmployeeId() );
        employeeDTO.username( employeeAccountUsername( employee ) );
        employeeDTO.employeeName( employeeAccountFullName( employee ) );
        employeeDTO.image( employeeAccountImage( employee ) );
        employeeDTO.identityCard( employeeAccountIdentityCard( employee ) );
        employeeDTO.email( employeeAccountEmail( employee ) );
        employeeDTO.phoneNumber( employeeAccountPhoneNumber( employee ) );
        employeeDTO.address( employeeAccountAddress( employee ) );
        employeeDTO.dateOfBirth( employeeAccountDateOfBirth( employee ) );
        employeeDTO.gender( employeeAccountGender( employee ) );
        employeeDTO.status( employeeAccountStatus( employee ) );

        return employeeDTO.build();
    }

    private String employeeAccountUsername(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        String username = account.getUsername();
        if ( username == null ) {
            return null;
        }
        return username;
    }

    private String employeeAccountFullName(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        String fullName = account.getFullName();
        if ( fullName == null ) {
            return null;
        }
        return fullName;
    }

    private String employeeAccountImage(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        String image = account.getImage();
        if ( image == null ) {
            return null;
        }
        return image;
    }

    private String employeeAccountIdentityCard(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        String identityCard = account.getIdentityCard();
        if ( identityCard == null ) {
            return null;
        }
        return identityCard;
    }

    private String employeeAccountEmail(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        String email = account.getEmail();
        if ( email == null ) {
            return null;
        }
        return email;
    }

    private String employeeAccountPhoneNumber(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        String phoneNumber = account.getPhoneNumber();
        if ( phoneNumber == null ) {
            return null;
        }
        return phoneNumber;
    }

    private String employeeAccountAddress(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        String address = account.getAddress();
        if ( address == null ) {
            return null;
        }
        return address;
    }

    private LocalDate employeeAccountDateOfBirth(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        LocalDate dateOfBirth = account.getDateOfBirth();
        if ( dateOfBirth == null ) {
            return null;
        }
        return dateOfBirth;
    }

    private String employeeAccountGender(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        String gender = account.getGender();
        if ( gender == null ) {
            return null;
        }
        return gender;
    }

    private Integer employeeAccountStatus(Employee employee) {
        if ( employee == null ) {
            return null;
        }
        Account account = employee.getAccount();
        if ( account == null ) {
            return null;
        }
        Integer status = account.getStatus();
        if ( status == null ) {
            return null;
        }
        return status;
    }
}
