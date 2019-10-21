%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Matlab 5 code for making a Self Organising Feature Map grid (SOFM)
% and letting it learn the form of a letter A
%
% by  Rajeev Raizada 
%     Dept. of Cognitive & Neural Systems
%     Boston University
%     rajeev@cns.bu.edu
%  
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Represent the SOFM as a 2-D grid of x,y coordinates
% i.e. 3 dimensions in all: Rows, Cols, Slices
% 3rd-Dimension slice 1: x-coords 
% 3rd-Dimension slice 2: y-coords
 
num_rows = 15;
num_cols = 15;
a = 0.2;   % Exponent in eta and G reduction (Hertz, Krogh and Palmer, p.237)

%%%%% Initialise with small x and y coords, centred on the origin
dx = 0.1;
dy = 0.1;
m = cat(3,dx*(1-2*rand(num_rows,num_cols)),dy*(1-2*rand(num_rows,num_cols)));
         % The "cat" command joins up two slices along 3rd matrix dimension

%%%%% Plot the shape which will be mapped (a letter A in this case);

%%%%%%% Plot an A 
%%%%%%% NB: It's better to have this in a separate function file,
%%%%%%%     but it's harder to e.mail the program that way. 
%%%%%%%     Same for making the A input below 

figure(1);
clf;

line([-0.8 -0.4],[-1 1]);
line([-0.8 -0.5],[-1 -1]);
line([-0.5 -0.38],[-1 -0.4]);
line([-0.02  0.1],[-0.4 -1]);
line([-0.02  -0.38],[-0.4 -0.4]);
line([0 0.4],[1 -1]);
line([0 -0.4],[1 1]);
line([-0.1 -0.2],[0 0.5]);
line([-0.3 -0.2],[0 0.5]);
line([-0.3 -0.1],[0 0]);
line([0.1 0.4],[-1 -1]);


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% The main loop

for cycle=1:5000,

	eta = cycle^(-a);		% Learning rate (how much nodes move)
	G = 0.5 + 10*cycle^(-a);		% Gaussian width parameter
	%%% NB: G<0.5 is boring because the Gaussian only covers one node

	%%%%% Give an input (in this case for an A-shape)
	x = 1-2*rand;
	y = 1-2*rand;

	while ~( (x>-0.4 & x<0 & y>-0.4 & y<0) | ... % Middle bar
	 	((y>-5*x - 0.5) & (y<-5*x + 1) ) | ...% Right diagonal
	 	((y>5*x + 1.5) & (y<5*x + 3) ) ) ...% Left diagonal
	 	x = 1-2*rand;
		y = 1-2*rand;
	end;

	inp = cat(3, x*ones(num_rows,num_cols), y*ones(num_rows,num_cols));
	      % Take the input x,y coords, and make each fill a slice
              % of a matrix the same size as m, so that they can be subtracted

	%%%%% Find winning node

	dist_mat_xy = (m - inp).^2;
              % First slice of this contains (squared) distances of x-coords,
              % second slice contains (squared) distances of y-coords
        dist_mat = sum(dist_mat_xy,3);
              % Sum across x and y slices to get total distance
	[win_rows,win_cols] = find(dist_mat==min(min(dist_mat)));
              % Finds the row and column of minimal distance grid point(s)
	rand_idx = ceil(length(win_rows)*rand);	
	win_row = win_rows(rand_idx);
	win_col = win_cols(rand_idx);
              % If two or more grid points tie for having shortest dist,
              % we need to pick one of them at random to be the winner.
              % These lines pick a random integer index, and pick the
              % entry from the winners vectors with this index
	
	%%% Calculate city-block distance from winner in grid
	[col_idx,row_idx] = meshgrid(1:num_cols,1:num_rows);
	      % This makes matrices of indices
	grid_dist = abs(row_idx-win_row) + abs(col_idx-win_col);
	
	%%% Calculate Gaussian movement-strength function for each node
	f_1dim = eta * exp(-(grid_dist/G).^2);
        f = cat(3,f_1dim,f_1dim);    % Make a slice for x and y coords

	%%%% Plot the map
	if max(cycle == [1 10 30 50 100 200 400 600 800 1000 3000 5000]),
	
		%%%%%%%%%% Do the plotting
		figure(1);
		if (cycle>1),delete(h);end;	% This wipes the old grid plot
		hold on;
		h=plot(m(:,:,1),m(:,:,2),'r-',m(:,:,1)',m(:,:,2)','r-');
				% This draws the new SOFM grid
		hold off;
		title(['Input presentation number ' num2str(cycle) ...
       			'     Neighbourhood size ' num2str(G) ...
       			'     Learning rate ' num2str(eta) ]); 
		drawnow;
		%eval(['print ' num2str(cycle) 'A.ps']);  
			% This would make a PostScript file
	end;

	%%% Move nodes
	m = m + f.*(inp-m);

end;    	%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Go to next cycle
