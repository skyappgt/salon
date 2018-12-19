$(document).ready( function(){
		//$('input[name="anio"]').val("");
		//$('input[name="codigo"]').val("");


	$('#asignap').click(function(event){

		let anio= $('input[name="anio"]');
		let codigo= $('input[name="codigo"]');
		let asigna=$('input[name="asigna"]:checked');
		
			$.ajax({
		      url: '/parqueo/asigna_parqueo',
		      type: 'POST',
		      dataType: 'json',
		      data: {codi:codigo.val(), ani:anio.val(), parqueo:asigna.val()},
		    })
		    .done((data) => {
		      //data = $(data);
		     //let det=JSON.stringify(data); 
		      
		      data.each(function(index, el) {
		        //codigo.append('<option value="'+el['id']+'">'+el['nombre']+'</option>');
		        //anio.append('<option value="'+el['id']+'">'+el['nombre']+'</option>');
		        $('#nomb').html(el['Nombre']);
		        $('#ape').html(el['Apellido']);
		          console.log(el['Nombre']);
		        
		      });
		      alert('Exito en asignacion')
		    })
		    .fail((data) => {
		      //codigo.append('<option value>Codigo no existe</option>');
		      //console.log(data.responseText);
		      alert('Parqueo Asignado!!');
		      //$('#nomb').empty();
		        //$('#ape').empty();
		    })
		    .always(() => {
		      console.log("Completado");
		    });
		

	})
	
	$('input[name="codigo"]').change(function(event){
		let codigo= $(this);
		let anio= $('input[name="anio"]');
		anio.empty();
		if($('input[name="codigo"]').val()=='' || $('input[name="anio"]').val()=='' ){

			alert('Favor Complete los campos requeridos');	
		}else{

			$.ajax({
		      url: '/universidad/consulta/alumno',
		      type: 'GET',
		      dataType: 'json',
		      data: {codigo: codigo.val(), anio:anio.val()},
		    })
		    .done((data) => {
		      data = $(data);
		     let det=JSON.stringify(data); 
		      
		      data.each(function(index, el) {
		        codigo.append('<option value="'+el['id']+'">'+el['nombre']+'</option>');
		        anio.append('<option value="'+el['id']+'">'+el['nombre']+'</option>');
		        $('#nomb').html(el['Nombre']);
		        $('#ape').html(el['Apellido']);
		          console.log(el['Nombre']);
		        
		      });
		    })
		    .fail((data) => {
		      codigo.append('<option value>Codigo no existe</option>');
		      console.log(data.responseText);
		      alert('No está Inscrito!!');
		      $('#nomb').empty();
		        $('#ape').empty();
		    })
		    .always(() => {
		      console.log("Completado");
		    });
			
		}
		

	})

})

