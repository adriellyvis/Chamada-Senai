package com.eyecount.controller.aluno;

import com.eyecount.dto.aluno.AlunoDashboardDTO;
import com.eyecount.dto.aluno.ChamadaAbertaAlunoDTO;
import com.eyecount.dto.aluno.HistoricoPresencaDTO;
import com.eyecount.dto.ocorrencia.OcorrenciaDTO;
import com.eyecount.model.Aluno;
import com.eyecount.service.AlunoService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/aluno")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AlunoController {
    private final AlunoService alunoService;

    @GetMapping("/dashboard/{usuarioId}")
    public ResponseEntity<AlunoDashboardDTO> dashboard(
            @PathVariable Integer usuarioId
    ) {
        return ResponseEntity.ok(
                alunoService.dashboard(usuarioId)
        );
    }

    @GetMapping("/presencas/{usuarioId}")
    public ResponseEntity<List<HistoricoPresencaDTO>> historico(
            @PathVariable Integer usuarioId
    ) {
        return ResponseEntity.ok(
                alunoService.historico(usuarioId)
        );
    }

    @GetMapping("/ocorrencias/{usuarioId}")
    public ResponseEntity<List<OcorrenciaDTO>> ocorrencias(
            @PathVariable Integer usuarioId
    ) {
        return ResponseEntity.ok(
                alunoService.ocorrencias(usuarioId)
        );
    }

    @GetMapping("/perfil/{usuarioId}")
    public ResponseEntity<Aluno> perfil(
            @PathVariable Integer usuarioId
    ) {
        return ResponseEntity.ok(
                alunoService.perfil(usuarioId)
        );
    }

    @GetMapping("/chamada-aberta/{usuarioId}")
    public ResponseEntity<ChamadaAbertaAlunoDTO> buscarChamadaAberta(
            @PathVariable Integer usuarioId
    ) {
        return ResponseEntity.ok(
                alunoService.buscarChamadaAberta(usuarioId)
        );
    }
}