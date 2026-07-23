package eyecount.repository;

import eyecount.model.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
/*
 * Repository de Perfil. Repository Spring Data responsavel pelas consultas e operacoes de
 * banco desta entidade.
 */

public interface PerfilRepository extends JpaRepository<Perfil, Integer> {
}
