package prezence.agenda;

public class AgendaApiException extends RuntimeException {
    private final int status;
    public AgendaApiException(int status, String mensagem) {
        super(mensagem);
        this.status = status;
    }
    public int getStatus() { return status; }
}
