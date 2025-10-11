import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { Nav } from '../../components/nav/nav';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-index',
  imports: [Header,Nav,Footer],
  templateUrl: './index.html',
  styleUrl: './index.css'
})
export class Index {

}
