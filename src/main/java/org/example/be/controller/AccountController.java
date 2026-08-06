package org.example.be.controller;

import org.example.be.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.example.be.dto.AccountDTO;
import org.example.be.dto.ApiResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;


@RestController
@RequestMapping("/api/Account")
public class AccountController {

    @Autowired
    private AccountService accountService;



}
