import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonSpinner, IonDatetime } from '@ionic/angular';
import { IonBackButton } from '@ionic/angular/common';
import { jsPDF } from 'jspdf';
import bcrypt from 'bcryptjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent,CommonModule,ReactiveFormsModule,IonList,IonItem,IonInput,IonButton,IonSpinner,IonDatetime],
  
})
export class HomePage {
  
  // Definición del formulario reactivo fuertemente tipado
  public registroForm: FormGroup;
  public minDate = this.getTodayDate();
  public isDarkMode = false;
  // Uso de Signals (visto en sesiones anteriores) para gestionar el estado de envío
  public isSubmitting = signal<boolean>(false);
  constructor(private fb: FormBuilder, private alertController: AlertController) {
    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required,
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)]],
      fecha: ['', Validators.required]
      // Patrón: Mínimo 8 caracteres, al menos una letra y un número.
    });
  }
  public toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }
  private getTodayDate(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }
  // Getter de conveniencia para acceder a los controles en la vista
  get f() { return this.registroForm.controls; }
  public async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched(); // Fuerza la visualización de errores
      return;
    }
    this.isSubmitting.set(true);
    try {
      const formData = this.registroForm.value;
      const passwordHash = await this.hashPassword(String(formData.password));
      console.log('Formulario con contraseña hasheada (solo demostración):', {
        ...formData,
        password: passwordHash
      });
      // Simulación de llamada asíncrona a un backend HTTP
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Aquí se implementaría: this.httpClient.post('url', formData).subscribe(...)
      this.registroForm.reset();
      const alert = await this.alertController.create({
        header: 'Formulario enviado',
        message: 'El formulario se ha enviado correctamente.',
        buttons: [
          {
            //texto descarga pdf y 
            text: 'Descargar PDF',
            handler: () => this.downloadPdf(formData)
          },
          'Aceptar'
        ]
      });
      await alert.present();
    } catch (error) {
      console.error('Error al persistir los datos', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
  //Descarga PDF
  private downloadPdf(formData: { [key: string]: unknown }): void {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Datos del formulario', 20, 20);
    pdf.setFontSize(12);

    const fields = [
      ['Nombre', String(formData['nombre'] ?? '')],
      ['Correo electrónico', String(formData['email'] ?? '')],
      ['Fecha', String(formData['fecha'] ?? '')]
    ];
    let y = 35;

    for (const [label, value] of fields) {
      const lines = pdf.splitTextToSize(`${label}: ${value}`, 170);
      pdf.text(lines, 20, y);
      y += lines.length * 7 + 4;
    }

    pdf.save('datos-formulario.pdf');
  }
}
