package eyecount.repository;

import eyecount.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
/*
 * Repository de Usuario. Repository Spring Data responsavel pelas consultas e operacoes de
 * banco desta entidade.
 */

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    /*
     * Busca registros aplicando os filtros descritos no metodo findByEmail.
     */
    Optional<Usuario> findByEmail(String email);

    /*
     * Consulta personalizada que conta os registros conforme as condicoes da JPQL.
     */
    @Query("""
    SELECT COUNT(u)
    FROM Usuario u
    WHERE u.ativo = true
""")
    Long countUsuariosAtivos();

    /*
     * Consulta personalizada que conta os registros conforme as condicoes da JPQL.
     */
    @Query("""
    SELECT COUNT(u)
    FROM Usuario u
    WHERE u.ativo = true
    AND LOWER(u.perfil.nome) = 'professor'
""")
    Long countProfessoresAtivos();
    /*
     * Busca registros aplicando os filtros descritos no metodo findByPerfilId.
     */
    List<Usuario> findByPerfilId(Integer perfilId);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByAtivoTrue.
     */
    Long countByAtivoTrue();
    /*
     * Conta registros aplicando os filtros descritos no metodo countByAtivoTrueAndPerfil_Id.
     */
    Long countByAtivoTrueAndPerfil_Id(Integer perfilId);
}
