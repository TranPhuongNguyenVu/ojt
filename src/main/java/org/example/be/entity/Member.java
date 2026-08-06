package org.example.be.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "MEMBER")
@Data
public class Member {
    @Id
    @Column(name = "MEMBER_ID")
    private String memberId;

    @Column(name = "SCORE")
    private Integer score;

    // Phép thuật ORM: Nối tự động sang bảng Account để xíu nữa mượn thông tin (Tên, Email...)
    @OneToOne
    @JoinColumn(name = "ACCOUNT_ID")
    private Account account;
}