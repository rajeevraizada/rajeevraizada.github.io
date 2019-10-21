% Code to run control analyses described in the
% Supplementary Information accompanying the paper
% "What makes different people's representations alike:
%  neural similarity-space solves the problem of across-subject fMRI decoding"
%  by Raizada & Connolly.
% This code was written by Rajeev Raizada, March 2011.

num_categories = 8;

all_possible_perms = perms(1:num_categories); 
num_perms = factorial(num_categories);

perm_num_correct_rec = zeros(1,num_perms);
%%% Calculate the distribution of correct answers for perms
for perm_num = 1:num_perms,  
   this_perm = all_possible_perms(perm_num,:);
   num_correct = sum(this_perm==[1:num_categories]);
   perm_num_correct_rec(perm_num) = num_correct;   
end;

perm_distribution = hist(perm_num_correct_rec,[0:num_categories]);
perm_p_values = perm_distribution / sum(perm_distribution);

%%% Calculate the distribution of correct answers for binomial
binomial_p_values = zeros(1,num_categories+1);
p = 1/num_categories;  % Chance of getting one right
q = 1-p;               % Change of getting one wrong

num_correct_vec = [0:num_categories];

for num_to_get_right = num_correct_vec,
   num_to_get_wrong = num_categories - num_to_get_right;
   binomial_p_values(num_to_get_right+1) = ...
      nchoosek(num_categories,num_to_get_right) * p^num_to_get_right * q^num_to_get_wrong;
end;

figure(1);
clf;
h_perm = plot(num_correct_vec,perm_p_values,'bo-');
hold on;
h_binom = plot(num_correct_vec,binomial_p_values,'ro-');
set(gca,'FontSize',16);
legend([h_perm h_binom],'Permutation','Binomial');
xlabel('Number of correct categorisations, out of 8');
ylabel('Probability');

binomial_expected_value_correct = sum(num_correct_vec.*binomial_p_values);
perm_expected_value_correct = sum(num_correct_vec.*perm_p_values);
title(['Expected value of num correct: ' ...
       '   Binomial: ' num2str(binomial_expected_value_correct,3) ...
       '   Perm: ' num2str(perm_expected_value_correct,3) ]);

%%%% Calculate how many right answers you need for the
%%%% p-val of getting that many correct to be p < 0.05
perm_critical_index = min(find(cumsum(perm_p_values) > 0.95 ));
perm_critical_value = num_correct_vec(perm_critical_index);

binomial_critical_index = min(find(cumsum(binomial_p_values) > 0.95 ));
binomial_critical_value = num_correct_vec(binomial_critical_index);

disp(['Perm distribution p < 0.05 critical value num-correct: ' ...
      num2str(perm_critical_value) ' out of ' num2str(num_categories) ]);
disp(['Binomial distribution p < 0.05 critical value num-correct: ' ...
      num2str(binomial_critical_value) ' out of ' num2str(num_categories) ]);
   
   

