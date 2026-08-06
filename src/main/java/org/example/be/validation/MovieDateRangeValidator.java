package org.example.be.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.example.be.dto.MovieRequestDTO;

import java.time.LocalDate;

public class MovieDateRangeValidator implements ConstraintValidator<ValidMovieDateRange, MovieRequestDTO> {

    @Override
    public boolean isValid(MovieRequestDTO dto, ConstraintValidatorContext context) {
        if (dto == null) {
            return true;
        }

        LocalDate fromDate = dto.getFromDate();
        LocalDate toDate = dto.getToDate();

        if (fromDate == null && toDate == null) {
            return true;
        }

        context.disableDefaultConstraintViolation();

        if (fromDate == null) {
            context.buildConstraintViolationWithTemplate("Vui lòng nhập ngày bắt đầu chiếu.")
                    .addPropertyNode("fromDate")
                    .addConstraintViolation();
            return false;
        }
        if (toDate == null) {
            context.buildConstraintViolationWithTemplate("Vui lòng nhập ngày kết thúc chiếu.")
                    .addPropertyNode("toDate")
                    .addConstraintViolation();
            return false;
        }
        if (toDate.isBefore(fromDate)) {
            context.buildConstraintViolationWithTemplate("Ngày kết thúc chiếu phải sau hoặc bằng ngày bắt đầu chiếu.")
                    .addPropertyNode("toDate")
                    .addConstraintViolation();
            return false;
        }
        return true;
    }
}
