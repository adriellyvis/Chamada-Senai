package eyecount.repository;

import eyecount.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
/*
 * Repository de Professor. Repository Spring Data responsavel pelas consultas e operacoes
 * de banco desta entidade.
 */

public interface ProfessorRepository extends JpaRepository<Professor, Integer> {
    /*
     * Busca registros aplicando os filtros descritos no metodo findByUsuarioId.
     */
    Optional<Professor> findByUsuarioId(Integer usuarioId);


}
