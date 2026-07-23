package eyecount.service;

import eyecount.model.Usuario;
import eyecount.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/*
 * Servico responsavel pelas operacoes basicas de usuario.
 *
 * Esta classe permite:
 * - consultar todos os usuarios cadastrados;
 * - devolver a lista completa ao controller.
 */
@Service
public class UsuarioService {

    // Repository usado para consultar os usuarios no banco.
    private final UsuarioRepository usuarioRepository;

    /*
     * Construtor usado pelo Spring para injetar o repository.
     *
     * Como existe apenas este construtor,
     * nao e necessario usar a anotacao @Autowired.
     */
    public UsuarioService(
            UsuarioRepository usuarioRepository
    ) {
        this.usuarioRepository = usuarioRepository;
    }

    /*
     * Lista todos os usuarios cadastrados.
     *
     * O metodo nao aplica filtros por:
     * - perfil;
     * - status ativo;
     * - nome;
     * - email.
     *
     * Ele devolve diretamente todas as entidades Usuario.
     */
    public List<Usuario> listarUsuarios() {

        // Busca todos os registros da tabela de usuarios.
        return usuarioRepository.findAll();
    }
}