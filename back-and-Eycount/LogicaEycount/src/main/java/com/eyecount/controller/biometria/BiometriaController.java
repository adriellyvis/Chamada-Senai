package com.eyecount.controller.biometria;

import com.eyecount.dto.biometria.BiometriaCadastroDTO;
import com.eyecount.dto.biometria.BiometriaPresencaDTO;
import com.eyecount.dto.biometria.BiometriaResponseDTO;
import com.eyecount.dto.presenca.PresencaDTO;
import com.eyecount.model.MetodoPresenca;
import com.eyecount.model.Presenca;
import com.eyecount.model.StatusPresenca;
import com.eyecount.service.BiometriaService;
import com.eyecount.service.PresencaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/biometria")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BiometriaController {

    private final PresencaService presencaService;
    private final BiometriaService biometriaService;

    @PostMapping("/presenca")
    public ResponseEntity<Presenca> registrarPresencaBiometrica(
            @RequestBody BiometriaPresencaDTO dto
    ) {
        PresencaDTO presencaDTO = new PresencaDTO(
                dto.getAlunoId(),
                dto.getAulaId(),
                StatusPresenca.PRESENTE,
                MetodoPresenca.BIOMETRIA
        );

        return ResponseEntity.ok(
                presencaService.registrar(presencaDTO)
        );
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<BiometriaResponseDTO> cadastrarBiometria(
            @RequestBody BiometriaCadastroDTO dto
    ) {
        return ResponseEntity.ok(
                biometriaService.cadastrar(dto)
        );
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<BiometriaResponseDTO>> listarBiometriasAtivas() {
        return ResponseEntity.ok(
                biometriaService.listarAtivos()
        );
    }
}