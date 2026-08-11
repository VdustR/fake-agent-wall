import { mount } from 'svelte'
import App from './App.svelte'
import './app.css'

const target = document.getElementById('deck')
if (!target) throw new Error('mount target #deck missing')

export default mount(App, { target })
