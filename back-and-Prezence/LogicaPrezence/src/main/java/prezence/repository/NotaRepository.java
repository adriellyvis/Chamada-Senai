package prezence.repository;

import prezence.model.Nota;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotaRepository
        extends JpaRepository<Nota, Integer> {

    List<Nota>
    findByAluno_IdOrderByDataAvaliacaoDesc(
            Integer alunoId
    );

    List<Nota>
    findByAluno_IdAndTurmaDisciplina_IdOrderByDataAvaliacaoDesc(
            Integer alunoId,
            Integer turmaDisciplinaId
    );

    List<Nota>
    findByTurmaDisciplina_IdOrderByAluno_Usuario_NomeAscDataAvaliacaoDesc(
            Integer turmaDisciplinaId
    );
}