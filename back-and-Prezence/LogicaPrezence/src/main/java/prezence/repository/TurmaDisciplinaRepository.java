package prezence.repository;

import prezence.model.TurmaDisciplina;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface TurmaDisciplinaRepository
        extends JpaRepository<TurmaDisciplina, Integer> {

    Optional<TurmaDisciplina> findFirstByTurmaId(
            Integer turmaId
    );

    List<TurmaDisciplina> findByProfessorId(
            Integer professorId
    );

    List<TurmaDisciplina> findByTurmaId(
            Integer turmaId
    );

    Optional<TurmaDisciplina>
    findByIdAndProfessor_Usuario_Id(
            Integer id,
            Integer usuarioId
    );
}