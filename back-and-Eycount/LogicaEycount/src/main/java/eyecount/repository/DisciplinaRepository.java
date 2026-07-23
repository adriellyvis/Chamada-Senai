package eyecount.repository;

import eyecount.model.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
/*
 * Repository de Disciplina. Repository Spring Data responsavel pelas consultas e operacoes
 * de banco desta entidade.
 */

public interface DisciplinaRepository extends JpaRepository<Disciplina, Integer> {
    /*
     * Busca registros aplicando os filtros descritos no metodo findByNome.
     */
    Optional<Disciplina> findByNome(String nome);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByNomeIgnoreCase.
     */
    Optional<Disciplina> findByNomeIgnoreCase(String nome);
}
