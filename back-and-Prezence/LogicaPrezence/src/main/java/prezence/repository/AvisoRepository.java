package prezence.repository;

import prezence.model.Aviso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvisoRepository
        extends JpaRepository<Aviso, Integer> {

    /*
     * Lista os avisos de um aluno do mais recente para o mais antigo.
     */
    List<Aviso> findByAluno_IdOrderByDataCriacaoDesc(
            Integer alunoId
    );

    /*
     * Lista somente avisos não lidos.
     */
    List<Aviso> findByAluno_IdAndLidoFalse(
            Integer alunoId
    );

    /*
     * Conta os avisos ainda não lidos.
     */
    Long countByAluno_IdAndLidoFalse(
            Integer alunoId
    );
}