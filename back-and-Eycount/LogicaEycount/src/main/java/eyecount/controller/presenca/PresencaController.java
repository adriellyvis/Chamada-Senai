package eyecount.controller.presenca;

import eyecount.dto.presenca.PresencaDTO;
import eyecount.model.Presenca;
import eyecount.service.PresencaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
/*
 * Controller da area Presenca. Controller responsavel por receber requisicoes HTTP, validar
 * os dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/presencas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PresencaController {

    // Dependencia que executa as regras de negocio desta operacao.
    private final PresencaService presencaService;

    /*
     * Recebe uma requisicao POST, envia os dados ao service e devolve o registro criado.
     */
    @PostMapping
    public ResponseEntity<Presenca> registrar(
            @RequestBody PresencaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                presencaService.registrar(dto)
        );
    }
}
