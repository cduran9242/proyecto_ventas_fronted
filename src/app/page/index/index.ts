import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { Nav } from '../../components/nav/nav'; // si existe

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [HeaderComponent, Nav, FooterComponent],
  templateUrl: './index.html',
  styleUrl: './index.css'
})
export class IndexComponent {}
