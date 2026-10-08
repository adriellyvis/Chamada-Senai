package prezence.controller.gestor;

import prezence.dto.suporte.AtualizarSolicitacaoSuporteDTO;
import prezence.dto.suporte.SolicitacaoSuporteDTO;

import prezence.service.SolicitacaoSuporteService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/gestor/suporte")
@RequiredArgsConstructor
public class GestorSuporteController {

    private final SolicitacaoSuporteService
            solicitacaoSuporteService;


    @GetMapping
    public ResponseEntity<List<SolicitacaoSuporteDTO>>
    listar() {

        return ResponseEntity.ok(
                solicitacaoSuporteService
                        .listarTodas()
        );
    }


    @PatchMapping("/{id}")
    public ResponseEntity<SolicitacaoSuporteDTO>
    atualizar(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @PathVariable
            Integer id,

            @Valid
            @RequestBody
            AtualizarSolicitacaoSuporteDTO dto
    ) {

        return ResponseEntity.ok(
                solicitacaoSuporteService
                        .atualizar(
                                usuarioId,
                                id,
                                dto
                        )
        );
    }
}