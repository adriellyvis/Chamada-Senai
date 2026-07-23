package eyecount.dto.dashboard;
/*
 * DTO DesempenhoDashboardDTO. DTO usado para transportar somente os dados necessarios entre
 * o backend e o front.
 */

public record DesempenhoDashboardDTO(
        String label,
        Double valor
) {
}
