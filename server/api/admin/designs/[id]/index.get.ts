import { designMitFormat } from '../../../../services/etikett'

export default defineEventHandler(event => fachlich(() => {
  const { design, format } = designMitFormat(useDb(), { id: Number(getRouterParam(event, 'id')) }, false)
  return { ...design, format }
}))
