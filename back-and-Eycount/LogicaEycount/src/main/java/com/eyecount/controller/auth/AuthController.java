package com.eyecount.controller.auth;

import com.eyecount.dto.auth.LoginDTO;
import com.eyecount.dto.auth.LoginResponseDTO;
import com.eyecount.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginDTO dto
    ) {
        System.out.println("CHEGOU NO CONTROLLER");

        return ResponseEntity.ok(
                authService.login(dto)
        );
    }
}