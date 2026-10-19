package prezence.repository;

import prezence.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface ProfessorRepository extends JpaRepository<Professor, Integer> {
    // Busca registros aplicando os filtros descritos no metodo findByUsuarioId.
    Optional<Professor> findByUsuarioId(Integer usuarioId);


}
