declare module 'react-formio' {
  export interface FormProps {
    form: any
    onSubmit?: (submission: any) => void
    options?: any
  }
  
  export const Form: React.ComponentType<FormProps>
}

declare module 'formiojs' {
  export class FormBuilder {
    static create(element: HTMLElement, schema: any, options?: any): Promise<FormBuilder>
    constructor(element: HTMLElement, schema: any, options?: any)
    destroy(): void
    on(event: string, callback: (data: any) => void): void
    schema: any
  }
}

declare module 'formiojs/dist/formio.full.css'