package eyecount.controller.biometria;

import eyecount.dto.biometria.BiometriaCadastroDTO;
import eyecount.dto.biometria.BiometriaPresencaDTO;
import eyecount.dto.biometria.BiometriaResponseDTO;
import eyecount.dto.presenca.PresencaDTO;
import eyecount.model.MetodoPresenca;
import eyecount.model.Presenca;
import eyecount.model.StatusPresenca;
import eyecount.service.BiometriaService;
import eyecount.service.PresencaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/*
 * Controller da area Biometria. Controller responsavel por receber requisicoes HTTP,
 * validar os dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/biometria")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BiometriaController {

    // Dependencia que executa as regras de negocio desta operacao.
    private final PresencaService presencaService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final BiometriaService biometriaService;

    /*
     * Recebe uma requisicao POST, envia os dados ao service e devolve o registro criado.
     */
    @PostMapping("/presenca")
    public ResponseEntity<Presenca> registrarPresencaBiometrica(
            @RequestBody BiometriaPresencaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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

    /*
     * Recebe os dados, executa as validacoes e cadastra um novo registro.
     */
    @PostMapping("/cadastrar")
    public ResponseEntity<BiometriaResponseDTO> cadastrarBiometria(
            @RequestBody BiometriaCadastroDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                biometriaService.cadastrar(dto)
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/ativos")
    public ResponseEntity<List<BiometriaResponseDTO>> listarBiometriasAtivas() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                biometriaService.listarAtivos()
        );
    }
}
