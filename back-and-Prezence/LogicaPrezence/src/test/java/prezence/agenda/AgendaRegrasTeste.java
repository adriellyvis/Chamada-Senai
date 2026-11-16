package prezence.agenda;

import java.time.LocalDateTime;

/** Testes executáveis apenas com o JDK 17+, sem banco, Spring ou internet. */
public class AgendaRegrasTeste {
    private static int testes;
    private static void checar(boolean condicao, String mensagem) {
        testes++;
        if (!condicao) throw new AssertionError(mensagem);
    }
    private static void rejeita(int statusEsperado, AgendaEventoDados dados, AgendaIdentidade autor) {
        boolean rejeitou = false;
        try { AgendaValidacao.validar(dados, autor); }
        catch (AgendaApiException e) { rejeitou = e.getStatus() == statusEsperado; }
        checar(rejeitou, "Esperava rejeição HTTP " + statusEsperado);
    }
    public static void main(String[] args) {
        AgendaIdentidade gestor = new AgendaIdentidade(1L, AgendaPerfil.GESTOR, "Gestão");
        AgendaIdentidade outroGestor = new AgendaIdentidade(9L, AgendaPerfil.GESTOR, "Outra gestão");
        AgendaIdentidade professor = new AgendaIdentidade(2L, AgendaPerfil.PROFESSOR, "Prof. teste");
        AgendaIdentidade outroProfessor = new AgendaIdentidade(8L, AgendaPerfil.PROFESSOR, "Outro docente");
        AgendaIdentidade aluno = new AgendaIdentidade(3L, AgendaPerfil.ALUNO, "Aluno teste");

        for (AgendaVisibilidade v : AgendaVisibilidade.values())
            checar(AgendaPermissoes.podeCriar(gestor,v), "Gestor pode usar " + v);
        checar(AgendaPermissoes.podeCriar(professor,AgendaVisibilidade.PRIVADO), "Professor cria privado");
        for (AgendaVisibilidade v : AgendaVisibilidade.values()) {
            if (v != AgendaVisibilidade.PRIVADO)
                checar(!AgendaPermissoes.podeCriar(professor,v), "Professor não publica " + v);
            checar(!AgendaPermissoes.podeCriar(aluno,v), "Aluno não cria " + v);
        }
        // Perfis têm visibilidade distinta; nenhum lê privados de terceiros.
        checar(AgendaPermissoes.podeVisualizar(gestor,1L,AgendaPerfil.GESTOR,AgendaVisibilidade.PRIVADO), "Gestor lê próprio");
        checar(!AgendaPermissoes.podeVisualizar(outroGestor,1L,AgendaPerfil.GESTOR,AgendaVisibilidade.PRIVADO), "Outro gestor não lê privado");
        checar(!AgendaPermissoes.podeVisualizar(gestor,2L,AgendaPerfil.PROFESSOR,AgendaVisibilidade.PRIVADO), "Gestor não lê privado do professor");
        checar(AgendaPermissoes.podeVisualizar(professor,2L,AgendaPerfil.PROFESSOR,AgendaVisibilidade.PRIVADO), "Docente lê próprio");
        checar(!AgendaPermissoes.podeVisualizar(outroProfessor,2L,AgendaPerfil.PROFESSOR,AgendaVisibilidade.PRIVADO), "Outro professor não lê privado");
        checar(!AgendaPermissoes.podeVisualizar(aluno,2L,AgendaPerfil.PROFESSOR,AgendaVisibilidade.PRIVADO), "Aluno não lê privado");

        for (AgendaVisibilidade v : new AgendaVisibilidade[] {AgendaVisibilidade.TODOS,AgendaVisibilidade.ALUNOS,AgendaVisibilidade.PROFESSORES}) {
            checar(AgendaPermissoes.podeVisualizar(gestor,1L,AgendaPerfil.GESTOR,v), "Gestor vê institucionais");
            checar(AgendaPermissoes.podeVisualizar(outroGestor,1L,AgendaPerfil.GESTOR,v), "Outro gestor vê institucionais");
        }
        checar(AgendaPermissoes.podeVisualizar(professor,1L,AgendaPerfil.GESTOR,AgendaVisibilidade.TODOS), "Professor vê todos");
        checar(AgendaPermissoes.podeVisualizar(professor,1L,AgendaPerfil.GESTOR,AgendaVisibilidade.PROFESSORES), "Professor vê professores");
        checar(!AgendaPermissoes.podeVisualizar(professor,1L,AgendaPerfil.GESTOR,AgendaVisibilidade.ALUNOS), "Professor não vê apenas alunos");
        checar(AgendaPermissoes.podeVisualizar(aluno,1L,AgendaPerfil.GESTOR,AgendaVisibilidade.TODOS), "Aluno vê todos");
        checar(AgendaPermissoes.podeVisualizar(aluno,1L,AgendaPerfil.GESTOR,AgendaVisibilidade.ALUNOS), "Aluno vê alunos");
        checar(!AgendaPermissoes.podeVisualizar(aluno,1L,AgendaPerfil.GESTOR,AgendaVisibilidade.PROFESSORES), "Aluno não vê apenas professores");
        checar(!AgendaPermissoes.podeVisualizar(aluno,2L,AgendaPerfil.PROFESSOR,AgendaVisibilidade.TODOS), "Não confia em eventos públicos de professor");
        checar(!AgendaPermissoes.podeVisualizar(professor,2L,AgendaPerfil.PROFESSOR,AgendaVisibilidade.TODOS), "Publicação irregular não é visível");

        checar(AgendaPermissoes.podeGerenciar(gestor,1L,AgendaPerfil.GESTOR), "Gestor edita próprio");
        checar(!AgendaPermissoes.podeGerenciar(gestor,9L,AgendaPerfil.GESTOR), "Gestor não edita outro");
        checar(AgendaPermissoes.podeGerenciar(professor,2L,AgendaPerfil.PROFESSOR), "Professor edita próprio");
        checar(!AgendaPermissoes.podeGerenciar(professor,1L,AgendaPerfil.GESTOR), "Professor não edita gestor");
        checar(!AgendaPermissoes.podeGerenciar(aluno,3L,AgendaPerfil.ALUNO), "Aluno não gerencia");

        LocalDateTime inicio = LocalDateTime.of(2026,11,20,9,0);
        LocalDateTime fim = inicio.plusHours(1);
        AgendaEventoDados valido = new AgendaEventoDados("Reunião de conselho", "Pauta", AgendaTipo.REUNIAO,
                inicio,fim,"Sala 20",AgendaVisibilidade.PROFESSORES);
        checar(AgendaValidacao.validar(valido,gestor).titulo().equals("Reunião de conselho"), "Gestor cadastra válido");
        rejeita(403,valido,professor);
        rejeita(403,valido,aluno);
        rejeita(400,new AgendaEventoDados("Oi","", AgendaTipo.REUNIAO,inicio,fim,"",AgendaVisibilidade.PRIVADO),gestor);
        rejeita(400,new AgendaEventoDados("Valido","", AgendaTipo.REUNIAO,inicio,inicio,"",AgendaVisibilidade.PRIVADO),gestor);
        rejeita(400,new AgendaEventoDados("Valido","", AgendaTipo.REUNIAO,inicio,fim,"",null),gestor);
        rejeita(400,new AgendaEventoDados("Valido","", AgendaTipo.REUNIAO,inicio,fim.plusDays(32),"",AgendaVisibilidade.PRIVADO),gestor);
        checar(AgendaValidacao.validar(new AgendaEventoDados("  Revisão  ",null,
                AgendaTipo.PLANEJAMENTO,inicio,fim,null,AgendaVisibilidade.PRIVADO),professor)
                .titulo().equals("Revisão"), "Sanitiza campos de texto");
        System.out.println("PASSOU: " + testes + " verificações de permissão e validação.");
    }
}
