package prezence.agenda;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/agenda/eventos")
public class AgendaEventoController {
    private final AgendaEventoService service;
    public AgendaEventoController(AgendaEventoService service) { this.service = service; }

    @GetMapping
    public List<AgendaEventoResposta> listar(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return service.listar(inicio, fim);
    }

    @PostMapping
    public AgendaEventoResposta criar(@RequestBody AgendaEventoDados dados) {
        return service.criar(dados);
    }

    @PutMapping("/{id}")
    public AgendaEventoResposta editar(@PathVariable long id, @RequestBody AgendaEventoDados dados) {
        return service.editar(id, dados);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
