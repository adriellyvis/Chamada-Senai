package eyecount.service;

import eyecount.dto.disciplina.DisciplinaDTO;
import eyecount.model.Disciplina;
import eyecount.repository.DisciplinaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/*
 * Servico responsavel pelas regras de negocio das disciplinas.
 *
 * Esta classe permite:
 * - listar todas as disciplinas;
 * - cadastrar uma nova disciplina;
 * - editar uma disciplina existente;
 * - excluir uma disciplina.
 */
@Service
public class DisciplinaService {

    // Repository usado para consultar, salvar e excluir disciplinas.
    private final DisciplinaRepository disciplinaRepository;

    /*
     * Construtor usado pelo Spring para injetar o repository.
     *
     * Como existe apenas este construtor, nao e necessario
     * usar a anotacao @Autowired.
     */
    public DisciplinaService(
            DisciplinaRepository disciplinaRepository
    ) {
        this.disciplinaRepository = disciplinaRepository;
    }

    /*
     * Lista todas as disciplinas cadastradas.
     *
     * O resultado e convertido de Disciplina para DisciplinaDTO
     * antes de ser devolvido ao controller.
     */
    public List<DisciplinaDTO> listar() {

        return disciplinaRepository

                // Busca todas as disciplinas salvas no banco.
                .findAll()

                // Transforma a lista de entidades em um fluxo.
                .stream()

                /*
                 * Converte cada entidade Disciplina em DisciplinaDTO.
                 * O DTO retorna apenas o ID e o nome da disciplina.
                 */
                .map(d -> new DisciplinaDTO(
                        d.getId(),
                        d.getNome()
                ))

                // Monta a lista final que sera devolvida ao controller.
                .toList();
    }

    /*
     * Cadastra uma nova disciplina.
     *
     * Antes de salvar, verifica se ja existe outra disciplina
     * com o mesmo nome.
     */
    public Disciplina cadastrar(
            DisciplinaDTO dto
    ) {

        /*
         * Busca uma disciplina pelo nome informado.
         *
         * Quando encontra um registro com o mesmo nome,
         * interrompe o cadastro e retorna erro 400.
         */
        disciplinaRepository
                .findByNome(dto.getNome())
                .ifPresent(d -> {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Disciplina já cadastrada"
                    );
                });

        // Cria uma nova entidade ainda nao salva no banco.
        Disciplina disciplina = new Disciplina();

        // Define o nome recebido no DTO.
        disciplina.setNome(dto.getNome());

        // Salva a disciplina no banco e devolve o registro criado.
        return disciplinaRepository.save(disciplina);
    }

    /*
     * Edita o nome de uma disciplina existente.
     *
     * O metodo busca a disciplina pelo ID,
     * altera o nome e salva a atualizacao.
     */
    public Disciplina editar(
            Integer id,
            DisciplinaDTO dto
    ) {

        /*
         * Busca a disciplina pelo ID informado.
         *
         * Caso nao encontre, retorna erro 404.
         */
        Disciplina disciplina =
                disciplinaRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Disciplina não encontrada"
                                )
                        );

        // Substitui o nome atual pelo nome recebido no DTO.
        disciplina.setNome(dto.getNome());

        // Salva a alteracao e devolve a disciplina atualizada.
        return disciplinaRepository.save(disciplina);
    }

    /*
     * Exclui uma disciplina pelo ID.
     *
     * Antes de excluir, confirma se o registro existe.
     */
    public void deletar(Integer id) {

        /*
         * Busca a disciplina pelo ID.
         *
         * Caso nao exista, retorna erro 404
         * e impede a tentativa de exclusao.
         */
        Disciplina disciplina =
                disciplinaRepository
                        .findById(id)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Disciplina não encontrada"
                        ));

        // Exclui a disciplina encontrada do banco.
        disciplinaRepository.delete(disciplina);
    }
}