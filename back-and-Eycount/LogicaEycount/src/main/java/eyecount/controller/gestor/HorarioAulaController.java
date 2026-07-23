package eyecount.controller.gestor;

import eyecount.dto.aula.AtualizarHorarioAulaDTO;
import eyecount.dto.aula.CriarHorarioAulaDTO;
import eyecount.dto.aula.HorarioAulaDTO;
import eyecount.service.GestorService;
import eyecount.service.HorarioAulaService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/*
 * Controller da area HorarioAula. Controller responsavel por receber requisicoes HTTP,
 * validar os dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/gestor/horarios-aula")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class HorarioAulaController {

    // Horario relacionado a este campo.
    private final HorarioAulaService horarioAulaService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final GestorService gestorService;

    /*
     * Recebe os dados, executa as validacoes e cadastra um novo registro.
     */
    @PostMapping
    public ResponseEntity<HorarioAulaDTO> cadastrar(
            @RequestHeader("usuario-id") Integer usuarioId,
            @Valid @RequestBody CriarHorarioAulaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        gestorService.validarGestor(usuarioId);

        HorarioAulaDTO horario =
                horarioAulaService.cadastrar(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(horario);
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping
    public ResponseEntity<List<HorarioAulaDTO>> listarTodos(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                horarioAulaService.listarTodos()
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/vinculo/{turmaDisciplinaId}")
    public ResponseEntity<List<HorarioAulaDTO>> listarPorVinculo(
            @RequestHeader("usuario-id") Integer usuarioId,
            @PathVariable Integer turmaDisciplinaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                horarioAulaService.listarPorVinculo(
                        turmaDisciplinaId
                )
        );
    }

    /*
     * Busca o registro, aplica as alteracoes recebidas e salva a atualizacao.
     */
    @PutMapping("/{id}")
    public ResponseEntity<HorarioAulaDTO> atualizar(
            @RequestHeader("usuario-id") Integer usuarioId,
            @PathVariable Integer id,
            @Valid @RequestBody AtualizarHorarioAulaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                horarioAulaService.atualizar(id, dto)
        );
    }

    /*
     * Localiza o registro e altera seu status atual.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<HorarioAulaDTO> alterarStatus(
            @RequestHeader("usuario-id") Integer usuarioId,
            @PathVariable Integer id
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                horarioAulaService.alterarStatus(id)
        );
    }
}
