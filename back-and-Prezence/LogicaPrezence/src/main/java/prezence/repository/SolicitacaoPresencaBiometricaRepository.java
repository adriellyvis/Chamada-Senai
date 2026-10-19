package prezence.repository;

import prezence.model.SolicitacaoPresencaBiometrica;
import prezence.model.StatusSolicitacaoBiometrica;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SolicitacaoPresencaBiometricaRepository
        extends JpaRepository<
        SolicitacaoPresencaBiometrica,
        Integer
        > {

    /*
     * Verifica se já existe uma solicitação pendente
     * para o aluno naquela aula.
     */
    Optional<SolicitacaoPresencaBiometrica>
    findByAluno_IdAndAula_IdAndStatus(
            Integer alunoId,
            Integer aulaId,
            StatusSolicitacaoBiometrica status
    );


    /*
     * Recupera a tentativa mais recente.
     *
     * Será usada pelo GET /status do aluno.
     */
    Optional<SolicitacaoPresencaBiometrica>
    findFirstByAluno_IdAndAula_IdOrderByHorarioSolicitacaoDesc(
            Integer alunoId,
            Integer aulaId
    );


    /*
     * Lista as solicitações pendentes somente
     * das aulas pertencentes ao professor logado.
     */
    List<SolicitacaoPresencaBiometrica>
    findByStatusAndAula_TurmaDisciplina_Professor_Usuario_IdOrderByHorarioSolicitacaoDesc(
            StatusSolicitacaoBiometrica status,
            Integer professorUsuarioId
    );
}