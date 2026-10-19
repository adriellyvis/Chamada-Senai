package prezence.controller.turma;

import prezence.dto.disciplina.DisciplinaDTO;
import prezence.model.Disciplina;
import prezence.service.DisciplinaService;
import prezence.service.GestorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/*
 * Controller da area Disciplina. Controller responsavel por receber requisicoes HTTP,
 * validar os dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/disciplinas")
@RequiredArgsConstructor
public class DisciplinaController {

    // Dependencia que executa as regras de negocio desta operacao.
    private final GestorService gestorService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final DisciplinaService disciplinaService;

    // =====================================================
    // METODO AUXILIAR
    // =====================================================
    private Integer obterUsuarioId(HttpServletRequest request) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return (Integer) request.getAttribute("usuarioId");
    }

    // =====================================================
    // LISTAR
    // =====================================================
    @GetMapping
    public ResponseEntity<List<DisciplinaDTO>> listarDisciplinas(
            HttpServletRequest request
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                disciplinaService.listar()
        );
    }

    // =====================================================
    // CADASTRAR
    // =====================================================
    @PostMapping
    public ResponseEntity<Disciplina> cadastrarDisciplina(
            @Valid @RequestBody DisciplinaDTO dto,
            HttpServletRequest request
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(disciplinaService.cadastrar(dto));
    }

    // =====================================================
    // EDITAR
    // =====================================================
    @PutMapping("/{id}")
    public ResponseEntity<Disciplina> editarDisciplina(
            @PathVariable Integer id,
            @Valid @RequestBody DisciplinaDTO dto,
            HttpServletRequest request
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                disciplinaService.editar(id, dto)
        );
    }

    // =====================================================
    // DELETAR
    // =====================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarDisciplina(
            @PathVariable Integer id,
            HttpServletRequest request
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);
        disciplinaService.deletar(id);

        return ResponseEntity.noContent().build();
    }

}
