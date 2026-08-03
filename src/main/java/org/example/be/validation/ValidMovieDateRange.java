package org.example.be.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MovieDateRangeValidator.class)
public @interface ValidMovieDateRange {
    String message() default "Khoảng ngày chiếu không hợp lệ.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
