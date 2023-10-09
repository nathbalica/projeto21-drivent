import { ApplicationError } from "@/protocols";

export function noEnrollmentOrInvalidTicketError(message: string): ApplicationError {
    return {
      name: 'NoEnrollmentOrInvalidTicketError',
      message: 'Usuário não tem inscrição ou ingresso inválido.',
    };
  }
