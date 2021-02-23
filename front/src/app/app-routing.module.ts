import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SigninComponent } from './pages/signin/signin.component';
import { SignupComponent } from './pages/signup/signup.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { AddImageComponent } from './pages/add-image/add-image.component';
import { AlbumsComponent } from './pages/albums/albums.component';
import { AlbumViewComponent } from './pages/album-view/album-view.component';
import { AuthGuard } from './auth/auth.guard';


const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  { path: 'signin', component: SigninComponent },
  { path: 'signup', component: SignupComponent},
  { path: 'mainpage', component: MainPageComponent, canActivate: [AuthGuard] },
  { path: 'add-image', component: AddImageComponent, canActivate: [AuthGuard] },
  { path: 'albums', component: AlbumsComponent, canActivate: [AuthGuard] },
  { path: 'album/:name', component: AlbumViewComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
