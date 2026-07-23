package eyecount.controller.turma;

import eyecount.dto.turma.TurmaDTO;
import eyecount.model.Turma;
import eyecount.service.GestorService;
import eyecount.service.TurmaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/*
 * Controller da area Turma. Controller responsavel por receber requisicoes HTTP, validar os
 * dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/turmas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TurmaController {

    // Dependencia que executa as regras de negocio desta operacao.
    private final TurmaService turmaService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final GestorService gestorService;

    // =====================================================
    // METODO AUXILIAR
    // =====================================================
    private Integer obterUsuarioId(HttpServletRequest request) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return (Integer) request.getAttribute("usuarioId");
    }

    // =====================================================
    // TURMAS
    // =====================================================
    @GetMapping
    public ResponseEntity<List<TurmaDTO>> listarTurmas(
            HttpServletRequest request
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                turmaService.listar()
        );
    }

    /*
     * Recebe os dados, executa as validacoes e cadastra um novo registro.
     */
    @PostMapping
    public ResponseEntity<Turma> cadastrarTurma(
            @Valid @RequestBody TurmaDTO dto,
            HttpServletRequest request
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(turmaService.cadastrar(dto));
    }

    /*
     * Busca o registro, aplica as alteracoes recebidas e salva a atualizacao.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Turma> editarTurma(
            @PathVariable Integer id,
            @Valid @RequestBody TurmaDTO dto,
            HttpServletRequest request
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                turmaService.editar(id, dto)
        );
    }

    /*
     * Localiza o registro e altera seu status atual.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Turma> alterarStatusTurma(
            @PathVariable Integer id,
            HttpServletRequest request
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                turmaService.alterarStatus(id)
        );
    }

}
