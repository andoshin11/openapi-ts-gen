import { PetStore } from './types'

const sampleResponse: PetStore.pets.createPetsResponse = {
  pet: {
    id: 1,
    name: 'Gritz'
  }
}

console.log(sampleResponse.pet)
