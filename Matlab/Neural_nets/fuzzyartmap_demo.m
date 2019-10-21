%%% Implementation of a Fuzzy ARTMAP graphical demo, in Matlab
%%% Written by Rajeev Raizada, 16/4/97

disp('Graphical demo of Fuzzy ARTMAP learning');
disp('the Circle-in-the-Square task.');
disp('  ');
disp('Written by:  Rajeev Raizada, ');
disp('             Dept. of Cognitive and Neural Systems, ');
disp('             Boston University.');
disp('E.mail: rajeev@cns.bu.edu');
disp('Copyright (c) Rajeev Raizada, April 14th, 1997');
disp('  ');
disp('Original Reference:'); 
disp('Carpenter, G. A., Grossberg, S., Markuzon, N., ');
disp('Reynolds, J. H. and Rosen, D. B. (1992)        ');
disp('"Fuzzy ARTMAP: A Neural Network Architecture for Incremental');
disp('Supervised Learning of Analog Multidimensional Maps"');
disp('IEEE Transactions on Neural Networks,');
disp('Vol. 3, No. 5, pp. 698-713.');
disp('  ');
disp('Category boxes are shown, along with the');
disp('true decision boundary.');
disp('A category which resonates in the ARTa module for');
disp('a given input lights up, shown with a thick line.');
disp('It may then get reset by F_ab layer mismatch, and shown dotted.');
disp('Categories which match at F_ab can undergo learning.');
disp('Fast learning is used here, so a category box expands');
disp('to contain the input.');
disp('  ');
disp('Key:');
disp('Presented point:                                  *');
disp('Category which predicts being INSIDE the circle:  Solid line');
disp('Category which predicts being OUTSIDE the circle: Dashed line');
disp('Category resonating within ARTa module:           Thick line');
disp('Category reset by match-tracking:                 Dotted line');
disp('Point sized category: marked by a cross:          x');
disp('  ');
disp('After each step, the program pauses. PRESS ANY KEY TO CONTINUE');

colordef none;			% So it looks ok on a black & white screen

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% The input and output

num_pats = 100;
sq = 1;                         % Size of square
r = sq/sqrt(2*pi);              
               % Radius of circle so it's half area of square
xcent = 0.5;
ycent = 0.5;                    % Centre of circle
a = [ xcent*ones(1,num_pats); ycent*ones(1,num_pats)] + ...
        sq*(0.5-rand(2,num_pats));              % The x,y coords
bmat = ((a(1,:)-xcent).^2 + (a(2,:)-ycent).^2) > r^2;
bmat = [ bmat; 1-bmat ];        % Change to [1 0], [0 1] form

ac = [a; ones(size(a))-a];   % The complement-coded form of input a

%%%%%%%%%%%%%%%%% If we are testing, make a grid of test inputs
test_mode = 0;    % Zero means we're testing, 1 means training

if test_mode==1,
        grain = 100;
        grx = linspace(xcent-sq/2,xcent+sq/2,grain)';
        gry = linspace(ycent-sq/2,ycent+sq/2,grain)';
        testpats = zeros(grain^2,2);    % Initialise
        for i=1:grain,
                testpats(1+grain*(i-1):i*grain,1) = grx;
                testpats(1+grain*(i-1):i*grain,2) = ...
                                    ones(grain,1)*gry(i);
        end;
        testpats = [ testpats' ; 1-testpats' ];
        test_out = zeros(size(testpats,2),1);   
                             % Initialise output vector
end;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Parameters

alpha = 0.001;  % "Choice" parameter > 0. Set small for the
                % conservative limit (Fuzzy AM paper, Sect.3)
beta = 1;       % Learning rate. Set to 1 for fast learning
rho_a_bar = 0;  % Baseline vigilance for ARTa, in range [0,1]
M = size(a,1);  % Number of input components. Derived from data
                % NB: Total input size = 2M (due to complement)
N = 20;         % Number of available coding nodes
                % We start with some resonably large number
                % then, if we need to, can add more uncommitted
L = size(bmat,1);       % Number of output nodes. Derived from data
rho_ab = 0.95;          % Map field vigilance, in [0,1]
epsilon = 0.001;        % Fab mismatch raises ARTa vigilance to this 
                        % much above what is needed to reset ARTa
num_patterns = size(a,2);   % Number of input patterns

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Set up weights

w_a = ones(2*M,N);      % Initial weights in ARTa. All set to 1
                        % Row-i, col-j entry = weight from input node i
                        % to F2 coding node j
w_ab = ones(L,N);       % Row-k, col-j entry = weight from ARTa F2 
                        % node j to Map Field node k
committed_nodes = [];   % Keep a record of which nodes get committed

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Main loop
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% 

for i=1:num_patterns    % Go through patterns one by one 
                        % Note: could shuffle order using randperm 

        A = ac(:,i);    % Present input is i-th column of ac

        %%%%%%%%%%%%%%%%%%% Plot all the category boxes
        figure(1);
        clf;
        %%%% Box x-path: u1, 1-vc1, 1-vc1, u1, u1
        %%%% Box y-path: u2, u2, 1-vc2, 1-vc2, u2
        hold on;
        h = plot([w_a(1,:); 1-w_a(3,:); 1-w_a(3,:); ...
                  w_a(1,:); w_a(1,:)], ...
                 [w_a(2,:); w_a(2,:); 1-w_a(4,:); ...
                  1-w_a(4,:); w_a(2,:)],'w-');
        %%%%%%%% Make the outside-circle predicting boxes dashed
        outboxes = find(w_ab(1,:)>w_ab(2,:));   
                %%%%%%% w_ab will be near [1 0]
        if ~isempty(outboxes),
                set( h(outboxes),'LineStyle','--');
        end;
        %%%%%%%%%% Mark all the point-size boxes with crosses
        point_boxes = find(abs(sum(w_a)-M)<0.001);
        for j=1:length(point_boxes),
                hpoint = plot(w_a(1,point_boxes(j)), ...
                              w_a(2,point_boxes(j)),'x');
                h(point_boxes(j)) = hpoint;     
                       %%% Make handle point to 'x'
        end;
        %%%%%%%%%%%%%%%%%%%%%%%%%%%% Plot the input vector
        title(['Presenting input number ' num2str(i) ...
               '. It is ( ' num2str(A(1)) ...
               ', ' num2str(A(2)) ' )'  ]);
        plot(A(1),A(2),'*');    % Show the input with a star
        %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Draw the circle
        ang = 0:0.1:2.1*pi;
        plot(xcent+r*cos(ang),ycent+r*sin(ang),'w-');
        axis([-0.1 1.1 -0.1 1.1]);
        axis('equal');
        drawnow;
        hold off;
        pause;

        %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        % Find an ARTa resonance which gives Fab resonance too

        %%%%%%%%%%%%%%%%% Initialise
        rho_a = rho_a_bar;      
               % We start off with ARTa vigilance at baseline
        resonant_a = 0;         
               % We're not resonating in the ARTa module yet
        resonant_ab = 0;        
               % Not resonating in the Fab match layer either
        already_reset_nodes = [];  % We haven't rest any ARTa nodes 
                                   % for this input pattern yet

while resonant_ab == 0, %%%% We don't have an Fab match yet.
        %%%% So, we find an ARTa node and see what it predicts

        while resonant_a == 0,  
                %%% In search of a resonating ARTa node...

                %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                %%%%%%%%%% Find the winning, matching ARTa node
                N = size(w_a,2);   
                        % Count how many F2a nodes we have

                A_for_each_F2_node = A * ones(1,N);
                        % Matrix containing a copy of A for 
                        % each F2 node. Useful for Matlab

                A_AND_w = min(A_for_each_F2_node,w_a);  
                        % Fuzzy AND = min

                S = sum(A_AND_w);       
                        % Row vector of signals to F2 nodes

                T = S ./ (alpha + sum(w_a));    
                        % Choice function vector for F2

                %%%%%%%%% Set all the reset nodes to zero

                T(already_reset_nodes) = ...
                        zeros(1,length(already_reset_nodes));

                %%%%%%%%%%%% Finding the winning node, J

                [ Tmax, J ] = max(T);   
                        % Matlab function max works such that
                        % J is the lowest index of max T elements, as
                        % desired. J is the winning F2 category node
        
                y = zeros(1,N); 
                y(J)=1; 
                        % Activities of F2. All zero, except J

                w_J = w_a(:,J);         
                        % Weight vector into winning F2 node, J

                x = min(A,w_J);   
                        % Fuzzy version of 2/3 rule. x is F1 activity
                        % NB: We could also use J-th element of S
                        % since the top line of the match fraction
                        % |I and w|/|I| is sum(x), which is 
                        % S = sum(A_AND_w) from above

                %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                %%%%%%%% Testing if the winning node resonates in ARTa

                if sum(x)/sum(A) >= rho_a,      
                                        % If a match, we're done
                        resonant_a = 1;         % ARTa resonates
                end;    
                % The while resonant_a == 0 command will stop looping
                % now, so we exit the while loop and go onto to Fab

                if sum(x)/sum(A) < rho_a,       
                        % If mismatch then we reset
                        resonant_a = 0;     % So, still not resonating
                        already_reset_nodes = ...
                                        [ already_reset_nodes J ];
                end;            % Record that node J has been
                                % reset already.
                
                %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                % Creating a new node if we've reset all of them

                if length(already_reset_nodes) == N,   
                        % If all F2a nodes reset
                        w_a = [ w_a ones(2*M,1) ];      
                        % Add uncommitted node to ARTa weight vector
                        w_ab = [w_ab ones(L,1) ];
                        % Give the new F2a node a w_ab entry 
                        % Draw on the new uncommitted category box
                        hold on;
                        hnew = plot([0 1 1 0 0],[0 0 1 1 0],'w-');
                        hold off;
                        h = [ h; hnew ];  
                        %%% Add handle for new box to list
                end;    % Now go back and this new node should win
                        

        end;    % End of the while loop searching for ARTa resonance
                % If resonant_a = 0, we pick the next highest Tj
                % and see if *that* node resonates, i.e. goto "while"
                % If resonant_a = 1, we have found an ARTa resonance, 
                % namely node J
                % So we go on to see if we get Fab match with node J

        %%%%%%%%% Show the winning, matching ARTa node J
        set(h(J),'LineWidth',[4]);
        title(['Node ' num2str(J) ' was chosen by ARTa search.' ...
                ' Choice = ' num2str(Tmax) '. Match = ' ...
                num2str(sum(x)/sum(A)) '. Rho_a = ' num2str(rho_a) ]);
        pause;

        %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Match tracking

        if test_mode==0,                % If we're not testing
                b = bmat(:,i);          
                        % Desired output for input number i
                z = min(b,w_ab(:,J));   % Fab activation vector, z 
                        % (Called x_ab in Fuzzy ARTMAP paper)

                %%%%%% Test for Fab resonance

                if sum(z)/sum(b) >= rho_ab,     % We have an Fab match
                        resonant_ab = 1;
                        title(['Desired: ' num2str(b') ...
        '. F_{ab} act: ' num2str(z') '.  F_{ab} match score: ' ...
        num2str(sum(z)/sum(b)) '. Rho_{ab} = ' num2str(rho_ab) ...
        '. Match field resonates.']);
                        pause;
                end;            % This will cause us to leave the
                                % while resonant_ab==0 loop and
                                % go on to do learning.

                if sum(z)/sum(b) < rho_ab,   
                                % We have an Fab mismatch
                        resonant_ab = 0;  
                                % This makes us go through
                                % the resonant_ab==0 loop again
                        resonant_a = 0; % This makes us go through  
                                        % ARTa search again, this 
                                        % search being inside the 
                                        % resonant_ab==0 loop
                % Increase rho_a vigilance.
                % This will cause F2a node J to get reset when
                % we go back through the ARTa search loop again.
                % Also, *for this input*, the above-baseline
                % vigilance will cause a finer ARTa category to win

                        rho_a = sum(x)/sum(A) + epsilon;

                        %%%% Make the reset box dotted and thin
                        title(['Desired out: ' num2str(b') ...
       '. F_{ab} act: ' num2str(z') '. Match field resets. ' ... 
       'Rho_a increased to ' num2str(rho_a) ]);
                        set(h(J),'LineStyle',':');
                        set(h(J),'LineWidth',[0.5]);
                        pause;

                end;    % End of Fab mismatch if

        end;            % End of "if test_mode==0"

        if test_mode==1,        
                % If we're testing there can be no Fab mismatch
                % We just want the prediction.
                resonant_ab = 1;  % This is just to exit the loop
                test_out(i) = w_ab(:,J)/sum(w_ab(:,J));
                % The prediction is the normalised w_ab vector
        end;


end;    %%%%%%%%% End of the while resonant_ab==0 loop. 
        %%%%%%%%% Now we have a resonating ARTa output 
        %%%%%%%%% which gives a match at the Fab layer.
        %%%%%%%%% So, we go on to have learning 
        %%%%%%%%% in the w_a and w_ab weights 


        %%%%%%%%%% Let the winning, matching node J learn

        w_a(:,J) = beta*x + (1-beta)*w_a(:,J);  
                        % NB: x = min(A,w_J) = I and w
                        %%%% Learning on F1a <--> f2a weights

        w_ab(:,J) = beta*z + (1-beta)*w_ab(:,J); 
                        % NB: z=min(b,w_ab(J))=b and w
        
end;    %%%%%%%%% End of considering this input. 
        %%%%%%%%% Now we go on to the next input, and repeat 
