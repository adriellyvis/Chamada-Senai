package eyecount.repository;

import eyecount.model.GravidadeOcorrencia;
import eyecount.model.Ocorrencia;
import eyecount.model.StatusOcorrencia;
import eyecount.model.TipoOcorrencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
/*
 * Repository de Ocorrencia. Repository Spring Data responsavel pelas consultas e operacoes
 * de banco desta entidade.
 */

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, Integer> {
    /*
     * Busca registros aplicando os filtros descritos no metodo findByAluno_Id.
     */
    List<Ocorrencia> findByAluno_Id(Integer alunoId);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByProfessor_Id.
     */
    List<Ocorrencia> findByProfessor_Id(Integer professorId);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByStatus.
     */
    List<Ocorrencia> findByStatus(StatusOcorrencia status);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByTipo.
     */
    List<Ocorrencia> findByTipo(TipoOcorrencia tipo);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByStatus.
     */
    Long countByStatus(StatusOcorrencia status);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByGravidade.
     */
    Long countByGravidade(GravidadeOcorrencia gravidade);
    /*
     * Busca os primeiros registros ordenados conforme o metodo findTop10ByOrderByDataOcorrenciaDesc.
     */
    List<Ocorrencia> findTop10ByOrderByDataOcorrenciaDesc();
}
