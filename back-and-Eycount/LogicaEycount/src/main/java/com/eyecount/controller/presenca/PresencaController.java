package com.eyecount.controller.presenca;

import com.eyecount.dto.presenca.PresencaDTO;
import com.eyecount.model.Presenca;
import com.eyecount.service.PresencaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/presencas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PresencaController {

    private final PresencaService presencaService;

    @PostMapping
    public ResponseEntity<Presenca> registrar(
            @RequestBody PresencaDTO dto
    ) {
        return ResponseEntity.ok(
                presencaService.registrar(dto)
        );
    }
}