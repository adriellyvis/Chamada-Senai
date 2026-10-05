package prezence.controller.suporte;

import prezence.dto.suporte.CriarSolicitacaoSuporteDTO;
import prezence.dto.suporte.SolicitacaoSuporteDTO;

import prezence.service.SolicitacaoSuporteService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/suporte")
@RequiredArgsConstructor
public class SuporteController {

    private final SolicitacaoSuporteService
            solicitacaoSuporteService;


    @PostMapping("/acesso")
    public ResponseEntity<SolicitacaoSuporteDTO>
    enviar(

            @Valid
            @RequestBody
            CriarSolicitacaoSuporteDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        solicitacaoSuporteService
                                .criar(dto)
                );
    }
}